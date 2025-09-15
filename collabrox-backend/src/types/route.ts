import { RequestHandler } from 'express';

export type CRUDMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type Route = {
    path: string;
    method: CRUDMethod;
    handler: RequestHandler | any;
};