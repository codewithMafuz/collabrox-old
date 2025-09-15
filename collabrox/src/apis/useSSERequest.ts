import { useEffect, useRef, useState, useCallback } from "react";

const BASE_URL = (import.meta as any).env.VITE_COLLABROX_BASE_API || 'http://localhost:8000/api/v1';

type Endpoint = `/${string}`;

interface StartFunction {
  files?: File[] | File;
  filesFieldName?: string;
  abortPrevReq?: boolean;
  fields?: Record<string, string>;
}

interface UseSSERequestOptions {
  endpoint: Endpoint;
  method?: "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  timeoutSeconds?: number;
}

interface UseSSERequestResult {
  start: (options: StartFunction) => Promise<void>;
  abort: () => void;
  reset: () => void;
  message: string;
  error?: string;
  progress?: number;
  stage?: string;
  [key: string]: any;
}

type Data = Omit<UseSSERequestResult, 'start' | 'abort' | 'reset'>;

const initialState: Data = {
  message: '',
  error: undefined,
  progress: undefined,
  stage: undefined,
};

export function useSSERequest({
  endpoint,
  method = "PATCH",
  headers = {},
  timeoutSeconds = 60,
}: UseSSERequestOptions): UseSSERequestResult {
  const [data, setData] = useState<Data>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeoutIfExists = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  };

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setData(initialState);
    }
  }, []);

  const parseSSEChunk = useCallback((chunk: string): void => {
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const json = JSON.parse(line.slice(5).trim());
          if (isMountedRef.current) {
            setData(prev => ({ ...prev, ...json }));
          }
        } catch (err) {
          console.error('Failed to parse SSE data:', err);
        }
      }
    }
  }, []);

  const abort = useCallback((silent = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    clearTimeoutIfExists();

    if (!silent && isMountedRef.current) {
      setData(prev => ({
        ...prev,
        message: 'Connection aborted or canceled',
      }));
    }
  }, []);

  const start = useCallback(async ({
    files,
    filesFieldName = 'FILE',
    abortPrevReq = true,
    fields = {},
  }: StartFunction) => {
    try {
      if (abortPrevReq) {
        abort(true);
      }

      reset(); // clear state before starting

      abortControllerRef.current = new AbortController();

      const formData = new FormData();

      // Append files
      if (files) {
        if (Array.isArray(files)) {
          files.forEach(file => formData.append(filesFieldName, file));
        } else {
          formData.append(filesFieldName, files);
        }
      }

      // Append extra fields
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        body: formData,
        headers: {
          ...headers,
          Accept: 'text/event-stream',
        },
        credentials: 'include',
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Set up timeout
      timeoutIdRef.current = setTimeout(() => {
        abort();
        if (isMountedRef.current) {
          setData(prev => ({
            ...prev,
            error: 'Connection timed out',
            message: 'Connection timed out',
          }));
        }
      }, timeoutSeconds * 1000);

      // Read stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        parseSSEChunk(chunk);
      }

      clearTimeoutIfExists();

    } catch (err: any) {
      clearTimeoutIfExists();
      if (err.name !== 'AbortError' && isMountedRef.current) {
        setData(prev => ({
          ...prev,
          error: err.message,
          message: 'Failed to start connection',
        }));
      }
    }
  }, [endpoint, method, headers, timeoutSeconds, parseSSEChunk, abort, reset]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abort(true);
    };
  }, [abort]);

  return {
    ...data,
    start,
    abort,
    reset,
  } as UseSSERequestResult;
}
