import { HTMLAttributes } from "react";

interface TextToHTMLProps extends HTMLAttributes<HTMLDivElement> {
    textHTML: string;
    linksClickable?: boolean;
}

const processHTML = (html: string): string => {
    // Splitting HTML into tags and text parts
    const parts = html.split(/(<[^>]+>)/g);

    return parts.map((part, index) => {
        // Processing only text content (even indices)
        if (index % 2 === 0) {
            return part.replace(
                /\b(https?:\/\/[^\s<>{}\\]+\.[^\s<>{}\\]*|www\.[^\s<>{}\\]+\.[^\s<>{}\\]*)\b/gi,
                (url) => {
                    const href = url.startsWith('www.') ? `https://${url}` : url;
                    return `<a class="max-md:active:underline max-md:focus:underline md:hover:underline" target="_blank" href="${href}">${url}</a>`;
                }
            );
        }
        return part;
    }).join('');
};

const TextHTMLToHTML = ({
    textHTML,
    linksClickable = false,
    ...props
}: TextToHTMLProps) => {
    const processedHTML = linksClickable ? processHTML(textHTML) : textHTML;

    return (
        <div
            {...props}
            dangerouslySetInnerHTML={{ __html: processedHTML }}
        />
    );
};

export default TextHTMLToHTML;