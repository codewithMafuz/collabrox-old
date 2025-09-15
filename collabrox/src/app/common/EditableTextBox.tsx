import { useState, HTMLAttributes, useRef, useEffect, memo, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { MdHelpOutline, MdOutlineTextDecrease, MdOutlineTextIncrease } from 'react-icons/md';
import { RxFontBold, RxFontItalic, RxUnderline } from "react-icons/rx";
import { classNames } from '../../lib/StringUtils';

// Some vars keeping ready
const { ELEMENT_NODE, TEXT_NODE } = Node

// CSS_ALIAS manually configurations and some pre-computed storings
// It can be make dynamically generated .props, .vals, .pairs, but for now keeping like this

const CSS_ALIAS = {
    // can be add more manually here
    props: {
        // Sorted by longest property short code first
        'FW': 'font-weight',
        'TD': 'text-decoration',
        'FS': 'font-style',
        'FSz': 'font-size',
        'D': 'display',
    },
    vals: {
        // Sorted by longest value short code first
        'N': 'normal',
        'U': 'underline',
        'I': 'italic',
        'IB': 'inline-block',
    },
    pairs: {
        // Sorted by longest array first
        "_FT-": ["font-style:italic", "text-decoration:none", "display:inline-block"],
        "_FT+": ["font-style:italic", "text-decoration:underline"],
        "_FTI-": ["text-decoration:none", "display:inline-block"],
        "_TI": ["text-decoration:none", "display:inline-block"],
        "_T": ["text-decoration:underline"],
    },
}
const propShortCodes = Object.entries(CSS_ALIAS.props).reduce((acc, [shortCode, prop]) => {
    acc[prop] = shortCode;
    return acc;
}, {} as Record<string, string>);
const valShortCodes = Object.entries(CSS_ALIAS.vals).reduce((acc, [shortCode, val]) => {
    acc[val] = shortCode;
    return acc;
}, {} as Record<string, string>);
const sortedPairs = Object.entries(CSS_ALIAS.pairs).sort((a, b) => b[1].length - a[1].length);
const pairCompressedSequences = sortedPairs.map(([pairKey, pairStyles]) => {
    const compressedSequence = pairStyles.map(style => {
        const [prop, val] = style.replace(/\s/g, '').split(':');
        return `${propShortCodes[prop] || prop}${valShortCodes[val] || val}`;
    });
    return { pairKey, compressedSequence };
});
const pairRestoreMap = Object.entries(CSS_ALIAS.pairs).reduce((acc, [pairKey, pairStyles]) => {
    acc[pairKey] = pairStyles.map(style => {
        const [prop, val] = style.replace(/\s/g, '').split(':');
        return `${propShortCodes[prop] || prop}${valShortCodes[val] || val}`;
    });
    return acc;
}, {} as Record<string, string[]>);

// Function of making normal format to compressed format
const TAG_REGEX = {
    SPAN_OPEN: /<span\b/gi,                  // opening <span> tags
    SPAN_CLOSE: /<\/span>/gi,                // closing </span> tags
    BR_TAG: /<br\s*\/?>/gi,                  // <br> tags (with optional slash)
    STYLE_ATTR: /\s*style\s*=\s*"([^"]*)"/gi,// style attributes
    SPAN_TAG_CONTENT: /<s(.*?)>/gi           // compressed <s> tags with attributes
};
export const getCompressedFormatHTML = (originalHTML: string) => {
    if (!originalHTML) return ''
    let compressed = originalHTML
        .replace(TAG_REGEX.SPAN_OPEN, '<s')
        .replace(TAG_REGEX.SPAN_CLOSE, '</s>')
        .replace(TAG_REGEX.BR_TAG, '<b>');

    compressed = compressed.replace(TAG_REGEX.SPAN_TAG_CONTENT, (_, attrs: string) => {
        const processedAttrs = attrs.replace(TAG_REGEX.STYLE_ATTR, (_, styleValue: string) => {
            // Splitting and processing individual styles
            const parts = styleValue.split(';').filter(p => p.trim());
            const compressedStyles = parts.reduce((acc: string[], part) => {
                const [prop, val] = part.split(':').map(s => s.replace(/\s/g, ''));
                if (!prop || !val) return acc;

                // Converting to short codes
                acc.push(`${propShortCodes[prop] || prop}${valShortCodes[val] || val}`);
                return acc;
            }, []);

            // Replacing with pair keys where applicable
            for (const { pairKey, compressedSequence } of pairCompressedSequences) {
                let i = 0;
                while (i <= compressedStyles.length - compressedSequence.length) {
                    if (compressedStyles.slice(i, i + compressedSequence.length).join('') === compressedSequence.join('')) {
                        compressedStyles.splice(i, compressedSequence.length, pairKey);
                        i += 1; // Skipping ahead after replacement
                    } else {
                        i++;
                    }
                }
            }

            return ` S=${compressedStyles.join(';')}`;
        });
        return `<s${processedAttrs}>`;
    });
    return compressed;
}

// Function of restoring compressed format to normal
const REVERSED_VALS = CSS_ALIAS.props;
const REVERSED_PROPS = CSS_ALIAS.vals;
const SORTED_PROPS = Object.keys(REVERSED_VALS).sort((a, b) => b.length - a.length);
const RESTORE_REGEX = {
    SPAN_OPEN: /<s\b/gi,              // compressed <s> tags
    SPAN_CLOSE: /<\/s>/gi,            // compressed </s> tags
    BR_TAG: /<b>/gi,                  // compressed <b> tags
    STYLE_VALUE: /\s*S=([^"'\s>]+)/gi,// compressed style attributes
    SPAN_ATTRS: /<span(.*?)>/gi       // <span> tags with attributes
};

export const getRestoredCompressedFormatHTML = (compressedHTML: string) => {
    if (!compressedHTML) return ''
    let restored = compressedHTML
        .replace(RESTORE_REGEX.SPAN_OPEN, '<span')
        .replace(RESTORE_REGEX.SPAN_CLOSE, '</span>')
        .replace(RESTORE_REGEX.BR_TAG, '<br>');

    restored = restored.replace(RESTORE_REGEX.SPAN_ATTRS, (_, attrs) => {
        const processedAttrs = attrs.replace(RESTORE_REGEX.STYLE_VALUE, (_: string, styleVal: string) => {
            const styleParts = styleVal.split(';');
            const expandedParts: string[] = [];

            // Expand pair keys into their sequences
            for (const part of styleParts) {
                if (pairRestoreMap[part]) {
                    expandedParts.push(...pairRestoreMap[part]);
                } else {
                    expandedParts.push(part);
                }
            }

            // Convert short codes to original properties/values
            const restoredStyles = expandedParts.map(part => {
                for (const alias of SORTED_PROPS) {
                    if (part.startsWith(alias)) {
                        const valuePart = part.slice(alias.length);
                        return `${REVERSED_VALS[alias as keyof typeof REVERSED_VALS]}:${REVERSED_PROPS[valuePart as keyof typeof REVERSED_PROPS] || valuePart}`;
                    }
                }
                return part; // Fallback for unmatched parts
            });

            return ` style="${restoredStyles.join('; ')}"`;
        });
        return `<span${processedAttrs}>`;
    });
    return restored;
}

// Some interfaces or types
interface NodeBioObject {
    node: Node;
    indexId: number; // start 0
}
interface SelectionNodeBioObject extends NodeBioObject {
    isFullySelected: boolean;
    str?: string | null;
    selectFromIndex?: number;
    selectToIndex?: number;
}
interface SelectionState {
    selectionText: string; // basically the selected text range.toString()
    nodesStartToEnd: SelectionNodeBioObject[]; // nodeBioObjs (only one obj means startContainer and endContainer is same)
}
interface CopiedContent {
    tempSpan: HTMLSpanElement,
    selectedNodes: SelectionNodeBioObject[];
    text: string;
}
interface HistoryEntry {
    html: string;
    selection?: {
        startCumulated: number;
        endCumulated: number;
    };
}


// --- Utility functions
// -- Quick utils
const camelToKebabCase = (str: string) => str.replace(/[A-Z]/g, (ltr) => `-${ltr.toLowerCase()}`);
const getWithoutPx = (withPx: string) => parseInt(withPx.split('px')[0]);
// - To get style attributes {[prop] : value} only from style attribute (inline styled also called)
const getStyleAttrs = (elm: HTMLElement): Record<string, string> | null => {
    // Exiting if no style
    const styleText = elm.getAttribute('style');
    if (!styleText) return null;

    const result: Record<string, string> = {};
    let start = 0; // Track parsing position

    // This 'for' loop will be used for single-pass character scan
    for (let i = 0; i < styleText.length; i++) {
        if (styleText[i] === ':') {
            // Extracting property name once we find colon (':')
            const prop = styleText.slice(start, i).trim(); // Triming only once

            start = i + 1; // Jumping past or passed colon to value start (now start is here - `style="font-weight:|bold;"`)

            while (styleText[i] !== ';' && i < styleText.length) i++; // doing i++ until semi-colon
            const val = styleText.slice(start, i).trim(); // Extracting value

            // Only storing valid declarations
            if (prop && val) result[prop] = val;

            // Moving past or passed semicolon (';') for next declaration
            start = i + 1;
        }
    }

    return result;
};

// -- Related to node and html
const getNodeToNodeBioObj = (node: Node, indexId: number = 100000): NodeBioObject => ({
    node,
    indexId
})
const getHTMLToNodeBioObjs = (id: string): NodeBioObject[] => {
    const editableDiv = document.getElementById(id);
    if (!editableDiv) return [];

    let currNode: Node | null = editableDiv.firstChild;
    const nodes: NodeBioObject[] = [];
    let count = 0;

    // Trying recursive approach
    const traverseNode = (node: Node | null) => {
        if (!node) return;

        if (node.nodeType === TEXT_NODE) {
            // If it's a text node, pushing it into the result and moving to the next sibling
            nodes.push(getNodeToNodeBioObj(node, count++));
            if (node.nextSibling) {
                traverseNode(node.nextSibling);  // Going to the next sibling
            }
        } else {
            // If it's a non-text node (span), adding it to the result
            nodes.push(getNodeToNodeBioObj(node, count++));
            if (node.firstChild) {
                // Diving into the children of this non-text node
                traverseNode(node.firstChild);
            }

            // After handling children, moving to the next sibling
            if (node.nextSibling) {
                traverseNode(node.nextSibling);
            }
        }
    };

    // Starting traversing from the first child of the editableDiv
    traverseNode(currNode);
    return nodes;
};
const getNodeToSelectionNodeBioObj = (node: Node, indexId: number, isFullySelected?: boolean, selectFromIndex?: number, selectToIndex?: number): SelectionNodeBioObject => ({
    node,
    indexId,
    str: isFullySelected ? node.textContent : node.textContent?.substring(selectFromIndex ?? 0, selectToIndex),
    isFullySelected: !!isFullySelected,
    selectFromIndex,
    selectToIndex
})

// -- Stylings and applying
const getElmsStylePropertysVal = (node: HTMLElement | null, styleProp: string, startFromSelf: boolean = true): string => {
    let currNode = startFromSelf ? node : node?.parentElement;
    while (currNode && currNode.tagName !== 'DIV') {
        if (currNode.style?.getPropertyValue(styleProp)) return currNode.style.getPropertyPriority(styleProp)

        currNode = currNode.parentElement;
    }
    return currNode?.style?.getPropertyValue(styleProp) || ''; // here currNode is actually the main div
};
const applyStylingToElm = ({ span, textNode, styleProp, styledVal,
}: {
    span: HTMLSpanElement,
    textNode: Node,
    styleProp: string,
    styledVal: string,
}): { node: Node, startOffset?: number, endOffset?: number } => {

    // Getting the nearest parent's style's value for the 'styleProp' property
    const valByNearestParent = getElmsStylePropertysVal(span, styleProp, false);
    // Extracting all style properties from the current span element
    const styleAttrs = getStyleAttrs(span)
    const haveOtherStyles = styleAttrs ? Object.keys(styleAttrs).some(key => key !== styleProp) : false;

    // Checking if the nearest parent styleVal matches the new styled value, valByNearestParent === value indicates that parent able to apply same stying that now trying to apply
    if (valByNearestParent === styledVal) {
        // Checking if the span has only one style and does not contain any element
        if (!haveOtherStyles && !span.firstElementChild) {
            // Initializing merged text with the current text node's content
            let mergedText = textNode.textContent!;
            let startOffset = 0;
            let currNode: Node | null = span.previousSibling;

            // Iterating through previous text nodes and merging them
            while (currNode && currNode.nodeType === TEXT_NODE) {
                mergedText = currNode.textContent + mergedText;
                startOffset += (currNode.textContent || '').length;
                const prev = currNode.previousSibling;
                (currNode as Text).remove();
                currNode = prev;
            }

            // Iterating through next text nodes and merging them
            currNode = span.nextSibling;
            while (currNode && currNode.nodeType === TEXT_NODE) {
                mergedText += currNode.textContent;
                const next = currNode.nextSibling;
                (currNode as Text).remove();
                currNode = next;
            }

            // Creating a new text node with merged content
            const newTextNode = document.createTextNode(mergedText);
            // Replacing the span element with the newly created text node
            span.replaceWith(newTextNode);
            // Returning the updated node with start and end offsets
            return {
                node: newTextNode,
                startOffset,
                endOffset: startOffset + textNode.textContent!.length
            };
        } else {
            // Removing the specific style property from the span element
            span.style.removeProperty(styleProp);
            // Removing the style attribute if no styles are left
            if (!span.getAttribute('style')) span.removeAttribute('style');
            // Returning the updated span element with offsets
            return {
                node: span,
                startOffset: 0,
                endOffset: textNode.textContent!.length
            };
        }
    }

    // Applying the new styled value to the span element
    span.style.setProperty(styleProp, styledVal)

    return {// Returning the updated span element with offsets
        node: span,
        startOffset: 0,
        endOffset: textNode.textContent!.length
    };
};

// - Little seperately for text-decoration
const getElmsAppliedTxtDecVal = (node: HTMLElement | null): string => {
    let currNode = node

    while (currNode && currNode.tagName !== 'DIV') {
        const foundTxtDecVal = currNode.style
        const textDecoration = foundTxtDecVal?.getPropertyValue('text-decoration')
        if (textDecoration) {
            const display = foundTxtDecVal.getPropertyValue('display')

            if (display === 'inline-block') return 'none' // (display === inline-block) means 'text-decoration: none'
            // 'text-decoration === none' will not happen in this system without 'display: inline-block', because 'text-decoration: none' will be only try to apply where a parent (or parent in hierarchy) already have 'text-decoration: underline'
            else if (textDecoration === 'underline') return 'underline'
        }

        currNode = currNode.parentElement;
    }
    return 'none'; // We know that main div's text-decoration always gonna be 'none' by default
};
const getWillTxtDecNoneWork = (node: HTMLElement | null): boolean => {
    let currNode = node?.parentElement;

    while (currNode && currNode.tagName !== 'DIV') {
        const foundTxtDecVal = currNode.style
        const textDecoration = foundTxtDecVal?.getPropertyValue('text-decoration')
        if (textDecoration) {
            const display = foundTxtDecVal.getPropertyValue('display')

            if (display === 'inline-block') return true // (display === inline-block) means 'text-decoration: none'
            // 'text-decoration === none' will not happen in this system without 'display: inline-block', because 'text-decoration: none' will be only try to apply where a parent (or parent in hierarchy) already have 'text-decoration: underline'
            else if (textDecoration === 'underline') return false
        }

        currNode = currNode.parentElement;
    }
    return true; // We know that main div's text-decoration always gonna be 'none' by default
};
const applyTxtDecStylingToElm = ({
    span, textNode, value
}: {
    span: HTMLSpanElement,
    textNode: Node,
    value: 'underline' | 'none'
}): { node: Node, startOffset?: number, endOffset?: number } => {

    // Getting span's parent's applied text decoration : {value} (applied text-decoration value means whether it have now underline or not by any parent's affect)
    const valByNearestParent = getElmsAppliedTxtDecVal(span.parentElement);
    // Extracting all style properties from the current span element
    const styleAttrs = getStyleAttrs(span)
    const haveOtherStyles = styleAttrs ? Object.keys(styleAttrs).some(key => !['text-decoration', 'display'].includes(key)) : false;

    // Checking if the nearest parent styleVal matches the new styled value, valByNearestParent === value indicates that, any of this span's parent able to apply same stying that now trying to apply, 
    // So if not haveOtherStyles and don't have any element inside it, we can remove span element itself (but keeping its text) to make its text styled to same as trying to style
    if (valByNearestParent === value) {
        if (!haveOtherStyles && !span.firstElementChild) {
            // Initializing merged text with the current text node's content
            let mergedText = textNode.textContent!;
            let startOffset = 0;
            let currNode: Node | null = span.previousSibling;

            // Iterating through previous text nodes and merging them
            while (currNode && currNode.nodeType === TEXT_NODE) {
                mergedText = currNode.textContent + mergedText;
                startOffset += (currNode.textContent ?? '').length;
                const prev = currNode.previousSibling;
                (currNode as Text).remove();
                currNode = prev;
            }

            // Iterating through next text nodes and merging them
            currNode = span.nextSibling;
            while (currNode && currNode.nodeType === TEXT_NODE) {
                mergedText += currNode.textContent;
                const next = currNode.nextSibling;
                (currNode as Text).remove();
                currNode = next;
            }

            // Creating a new text node with merged content
            const newTextNode = document.createTextNode(mergedText);
            // Replacing the span element with the newly created text node
            span.replaceWith(newTextNode);
            // Returning the updated node with start and end offsets
            return {
                node: newTextNode,
                startOffset,
                endOffset: startOffset + (textNode.textContent)!.length
            };
        } else {
            // So if cannot be remove the span itself, removing the text-decoration property from the span element
            span.style.removeProperty('text-decoration');
            span.style.removeProperty('inline-block')
            // Removing the style attribute if no styles are left
            if (!span.getAttribute('style')) span.removeAttribute('style');
            // Returning the updated span element with offsets
            return {
                node: span,
                startOffset: 0,
                endOffset: textNode.textContent!.length
            };
        }
    }

    // Applying the new styled value to the span element
    span.style.setProperty('text-decoration', value)
    if (value === 'none') span.style.setProperty('display', 'inline-block') // adding 'display : inline-block' (when | in cases where) we think 'text-decoration: none' will not remove underline
    else { span.style.removeProperty('display') } // removing the 'display: inline-block' if exist when making a 'text-decoration: none to underline'

    return {// Returning the updated span element with offsets
        node: span,
        startOffset: 0,
        endOffset: textNode.textContent!.length
    };

}

const Symbols = [
    { name: "bulletPoint", text: "•" },
    { name: "triangleBullet", text: "‣" },
    { name: "rightArrow", text: "→" },
    { name: 'checkMark', text: '✓' },
]

interface EditableTextBoxProps extends HTMLAttributes<HTMLDivElement> {
    id: string;
    initialHTML: string;
    creditLimit?: number;
    showCharCount?: boolean;
    className?: string;
    parentDivProps?: HTMLAttributes<HTMLDivElement>;
    textToolsDivProps?: HTMLAttributes<HTMLDivElement>;
    textCreditCountDivProps?: HTMLAttributes<HTMLDivElement>;
    fontWeights?: { bold: number, normal: number };
    allowTranslate?: boolean;
    placeHolder?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    onContentChange?: ({ HTML, compressedHTML }: { HTML: string, compressedHTML?: string }) => void;
    FONT_WEIGHT?: { normal: number, bold: number };
    FONT_SIZE?: { default: number, min: number, max: number };
    onInputDelay?: 50 | 100 | 150 | 200 | 250 | 300 | 350 | 400;
}

// Main Component
const EditableTextBox = forwardRef(({
    id,
    initialHTML,
    creditLimit = 2000,
    showCharCount = false,
    className = "block text-gray-900 text-[16px] bg-transparent p-1 border-none outline-none",
    parentDivProps = {},
    textToolsDivProps = {},
    textCreditCountDivProps = {},
    fontWeights = { bold: 700, normal: 500 },
    placeHolder = '',
    allowTranslate = false,
    onFocus,
    onBlur,
    onContentChange,
    FONT_WEIGHT = { normal: 400, bold: 600 },
    FONT_SIZE = { default: 15, min: 14, max: 17 },
    onInputDelay = 150,
    ...props
}: EditableTextBoxProps, ref) => {
    const editableDiv = useRef<HTMLDivElement>(null);
    const [currentHTMLNodes, setCurrentHTMLNodes] = useState<NodeBioObject[]>([])

    const [fontWeight, fontSize] = useMemo(() => [FONT_WEIGHT, FONT_SIZE], [FONT_WEIGHT, FONT_SIZE])
    const [selectionObj, setSelectionObj] = useState<SelectionState>()
    const [copiedContent, setCopiedContent] = useState<CopiedContent>();

    const [nowFocus, setNowFocus] = useState<boolean>(false);

    const [isBoldActive, setIsBoldActive] = useState<boolean>(false)
    const [isItalicActive, setIsItalicActive] = useState<boolean>(false)
    const [isUnderlineActive, setIsUnderlineActive] = useState<boolean>(false)
    const [allowFontPlus, setAllowFontPlus] = useState<boolean | string>(true)
    const [allowFontMinus, setAllowFontMinus] = useState<boolean | string>(true)

    const [currentCredit, setCurrentCredit] = useState<number>(initialHTML.length)
    const creditCountBox = useRef<HTMLDivElement>(null)

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0)

    const reInitializeHTML = (compressedHTML: string, resetHistory = true) => {
        if (editableDiv.current) {
            const initialHTMLNormal = compressedHTML.length > 0 ? getRestoredCompressedFormatHTML(compressedHTML) : ''

            // Only update if different to prevent unnecessary resets
            if (editableDiv.current.innerHTML !== initialHTMLNormal) {
                if (resetHistory) {
                    editableDiv.current.innerHTML = ''
                    setHistory([])
                    setCurrentHistoryIndex(0)
                    setCurrentCredit(0)
                }
                editableDiv.current.innerHTML = initialHTMLNormal;

                setHistory([{ html: editableDiv.current?.innerHTML || '', selection: { startCumulated: 0, endCumulated: 0 } }]);
                setCurrentHistoryIndex(0);
            }
            setCurrentCredit(compressedHTML.length);
        }
    };

    useEffect(() => {
        reInitializeHTML(initialHTML)

        return () => {
            const currentTimeout = timeoutRef.current;
            if (currentTimeout) {
                clearTimeout(currentTimeout);
            }
        };
    }, []);

    useImperativeHandle(ref, () => ({ reInitializeHTML }));

    useEffect(() => {
        if (editableDiv.current) {
            const _initialHTML = getRestoredCompressedFormatHTML(initialHTML);
            editableDiv.current.innerHTML = _initialHTML;
        }
    }, [])

    useEffect(() => {
        const editableDivHTML = editableDiv.current?.innerHTML || ''
        const compressedHTML = getCompressedFormatHTML(editableDivHTML)
        setCurrentCredit(compressedHTML.length)
        if (onContentChange) onContentChange({
            HTML: editableDivHTML,
            compressedHTML
        });
    }, [currentHTMLNodes])

    useEffect(() => {
        const updateButtonStates = () => {
            if (!selectionObj?.nodesStartToEnd?.length) {
                setIsUnderlineActive(false);
                setIsBoldActive(false);
                setIsItalicActive(false);
                setAllowFontPlus(false)
                setAllowFontMinus(false)
                return;
            }

            // Getting first node in selection - (means what style gonna be applied to particular selection will be judged based on first node in the whole selection node or nodes, and buttons activeness will be also judged based on this)
            const firstNode = selectionObj.nodesStartToEnd[0].node;

            // Applying if node has styling of that (self or implied by parent hierarchy)
            setIsUnderlineActive(getElmsAppliedTxtDecVal((firstNode.nodeType === TEXT_NODE ? firstNode.parentElement : firstNode) as HTMLElement) === 'underline')
            setIsBoldActive(getElmsStylePropertysVal((firstNode.nodeType === TEXT_NODE ? firstNode.parentElement : firstNode) as HTMLElement, 'font-weight') === fontWeight.bold.toString())
            setIsItalicActive(getElmsStylePropertysVal((firstNode.nodeType === TEXT_NODE ? firstNode.parentElement : firstNode) as HTMLElement, 'font-style') === 'italic')

            const currentFontSize = getWithoutPx(((firstNode.nodeType === TEXT_NODE ? firstNode.parentElement : firstNode) as HTMLElement).style['fontSize'] || fontSize.default + 'px')
            setAllowFontPlus(currentFontSize + 1 <= fontSize.max ? (currentFontSize + 1) + 'px' : false)
            setAllowFontMinus(currentFontSize - 1 >= fontSize.min ? (currentFontSize - 1) + 'px' : false)
        };

        updateButtonStates();
    }, [selectionObj]);

    const handleOnFocus = () => {
        editableDiv.current?.focus();
        setNowFocus(true);
        if (onFocus) onFocus();
    };

    const handleOnBlur = () => {
        editableDiv.current?.blur();
        // setCopiedSelection(null)
        setNowFocus(false);
        if (onBlur) onBlur();
    };

    const handleOnSelect = useCallback(() => {
        const selection = window.getSelection();
        try {
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (range.toString().length !== 0) {
                    if (range.startContainer === range.endContainer) {
                        const nodesStartToEnd = [
                            getNodeToSelectionNodeBioObj(
                                range.startContainer,
                                currentHTMLNodes.findIndex(
                                    (obj) => obj.node === range.startContainer
                                ),
                                range.toString() === range.startContainer.textContent,
                                range.startOffset,
                                range.endOffset
                            ),
                        ];

                        setSelectionObj({
                            selectionText: range.toString(),
                            nodesStartToEnd,
                        });
                    } else {
                        const isFullySelectedStart =
                            range.startOffset === 0 &&
                            range.toString().startsWith(range.startContainer.textContent ?? '');

                        const isFullySelectedEnd =
                            range.endOffset === (range.endContainer.textContent ?? '').length &&
                            range.toString().endsWith(range.endContainer?.textContent ?? '');

                        const selectedNodes: SelectionNodeBioObject[] = [];

                        const sliceEnd =
                            currentHTMLNodes.findIndex(
                                (o) => o.node === range.endContainer
                            ) + 1;


                        const nodes = currentHTMLNodes.slice(
                            currentHTMLNodes.findIndex(
                                (o) => o.node === range.startContainer
                            ),
                            sliceEnd
                        );

                        nodes.forEach((obj, index) => {
                            if (index === 0) {
                                selectedNodes.push(
                                    getNodeToSelectionNodeBioObj(
                                        obj.node,
                                        index,
                                        isFullySelectedStart,
                                        range.startOffset,
                                        obj.node.textContent?.length
                                    )
                                );
                            } else if (index === nodes.length - 1) {
                                selectedNodes.push(
                                    getNodeToSelectionNodeBioObj(
                                        obj.node,
                                        index,
                                        isFullySelectedEnd,
                                        0,
                                        range.endOffset
                                    )
                                );
                            } else {
                                selectedNodes.push({
                                    ...obj,
                                    isFullySelected: true,
                                });
                            }
                        });

                        setSelectionObj({
                            selectionText: range.toString(),
                            nodesStartToEnd: selectedNodes,
                        });
                    }

                } else {
                    setSelectionObj(undefined);
                    if (history.length === 1) {
                        setHistory([{
                            html: history[0].html,
                            selection: { endCumulated: range.startOffset | 0, startCumulated: range.startOffset | 0 }
                        }])
                    }
                }
            }
        } catch (error) {
            selection?.removeAllRanges();
            setSelectionObj(undefined);
            console.error('Error in handleOnSelect:\n', error);
        }
    }, [currentHTMLNodes, history]);

    const saveInHistory = useCallback(() => {
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;

        const range = selection.getRangeAt(0);
        let startCumulated = 0;
        let endCumulated = 0;
        let foundStart = false;
        let foundEnd = false;

        const traverse = (node: Node): boolean => {
            if (node.nodeType === Node.TEXT_NODE) {
                const textLength = node.textContent?.length || 0;

                if (!foundStart) {
                    if (node === range.startContainer) {
                        startCumulated += range.startOffset;
                        foundStart = true;
                    } else {
                        startCumulated += textLength;
                    }
                }

                if (!foundEnd) {
                    if (node === range.endContainer) {
                        endCumulated += range.endOffset;
                        foundEnd = true;
                    } else {
                        endCumulated += textLength;
                    }
                }
            }

            if (node.childNodes.length > 0 && !(foundStart && foundEnd)) {
                for (const child of (node.childNodes as any)) {
                    if (traverse(child)) break;
                }
            }

            return foundStart && foundEnd;
        };

        if (editableDiv.current) traverse(editableDiv.current);

        setHistory(prev => {
            const sliced = prev.slice(0, (currentHistoryIndex ?? prev.length - 1) + 1);
            sliced.push({
                html: editableDiv.current?.innerHTML || '',
                selection: { startCumulated, endCumulated }
            });
            return sliced;
        });
        setCurrentHistoryIndex(prev => (prev === undefined ? 0 : prev + 1));
    }, [currentHistoryIndex]);

    const goNthInHistory = (nthHistory: number) => {
        const historyEntry = history[nthHistory];
        if (!historyEntry?.selection) return;

        editableDiv.current && (editableDiv.current.innerHTML = historyEntry.html);
        setCurrentHTMLNodes(getHTMLToNodeBioObjs(id));
        restoreHistoryRange(historyEntry.selection.startCumulated, historyEntry.selection.endCumulated);
        setCurrentHistoryIndex(nthHistory);
    };

    const restoreHistoryRange = (startCumulated: number, endCumulated: number) => {
        let currNode: Node | null = editableDiv.current?.firstChild || null;
        let startFound = false;
        let endFound = false;
        let cumulative = 0;
        let startNode: Node | null = null;
        let startOffset = 0;
        let endNode: Node | null = null;
        let endOffset = 0;

        const traverse = (node: Node) => {
            if (!node || (startFound && endFound)) return;

            if (node.nodeType === Node.TEXT_NODE) {
                const textLength = node.textContent?.length || 0;

                // Find start position
                if (!startFound && cumulative + textLength >= startCumulated) {
                    startNode = node;
                    startOffset = Math.max(0, Math.min(startCumulated - cumulative, textLength));
                    startFound = true;
                }

                // Find end position
                if (!endFound && cumulative + textLength >= endCumulated) {
                    endNode = node;
                    endOffset = Math.max(0, Math.min(endCumulated - cumulative, textLength));
                    endFound = true;
                }

                cumulative += textLength;
            }

            if (node.firstChild && !(startFound && endFound)) {
                traverse(node.firstChild);
            }
            if (node.nextSibling && !(startFound && endFound)) {
                traverse(node.nextSibling);
            }
        };

        if (currNode) traverse(currNode);

        if (startNode && endNode) {
            const range = document.createRange();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);

            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

            // Ensuring cursor (caret) is visible after undo or redo
            setTimeout(() => {
                const selectionRect = range.getBoundingClientRect();
                const editableBox = editableDiv.current?.getBoundingClientRect();

                if (editableBox && selectionRect) {
                    if (selectionRect.top < editableBox.top || selectionRect.bottom > editableBox.bottom) {
                        editableDiv.current?.scrollTo({
                            top: editableDiv.current.scrollTop + selectionRect.top - editableBox.top - 20,
                            behavior: 'smooth'
                        });
                    }
                }
            }, 50);
        }
    };

    const handleUndo = () => {
        if (currentHistoryIndex > 0) {
            goNthInHistory(currentHistoryIndex - 1);
        }
    };

    const handleRedo = () => {
        const redoIndex = currentHistoryIndex + 1
        if (redoIndex <= (history.length - 1)) goNthInHistory(redoIndex)
    }

    const handleKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') {
            handleUndo()
            ev.preventDefault();
        }

        if ((ev.ctrlKey || ev.metaKey) && ev.key === 'y') {
            handleRedo()
            ev.preventDefault();
        }
    };

    const doRefiningToHTML = () => {
        try {
            const editable = editableDiv.current;
            if (!editable) return;

            // Processing all DIV elements first
            const divs = editable.getElementsByTagName('div');
            while (divs.length > 0) {
                const div = divs[0];
                const parent = div.parentElement;
                if (!parent) break;

                const fragment = document.createDocumentFragment();
                const children = Array.from(div.childNodes);

                if (children.length > 0) {
                    parent.insertBefore(document.createElement('br'), div);
                }

                children.forEach(child => fragment.appendChild(child));
                parent.replaceChild(fragment, div);
            }

            // Processing all UL elements
            const uls = editable.getElementsByTagName('ul');
            while (uls.length > 0) {
                const ul = uls[0];
                const parent = ul.parentElement;
                if (!parent) break;

                const span = document.createElement('span');
                span.style.textDecoration = 'underline';
                span.textContent = ul.textContent;
                parent.replaceChild(span, ul);
            }

            // Updating cursor position
            const selection = window.getSelection();
            const range = (selection?.rangeCount ?? 0) > 0 ? selection?.getRangeAt(0) : null;
            if (range && uls.length > 0) {
                const spans = editable.getElementsByTagName('span');
                const lastSpan = spans[spans.length - 1];
                if (lastSpan?.firstChild?.nodeType === TEXT_NODE) {
                    const len = lastSpan.textContent?.length || 0;
                    range.setStart(lastSpan.firstChild, len);
                    range.setEnd(lastSpan.firstChild, len);
                }
            }
        } catch (error) {
            console.error("Error in handleOnInput:", error);
        }
    };

    const handleOnInput = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            doRefiningToHTML();
            const newHTML = editableDiv.current?.innerHTML;
            if (!newHTML) return
            const newCompressed = getCompressedFormatHTML(newHTML);
            setCurrentCredit(newCompressed.length);
            setCurrentHTMLNodes(getHTMLToNodeBioObjs(id));

            // If new input is made after undoing, clear forward history
            setHistory(prev => prev.slice(0, (currentHistoryIndex ?? prev.length - 1) + 1));

            saveInHistory();
        }, onInputDelay);
    };

    const handleOnCopy = (ev?: React.ClipboardEvent<HTMLDivElement>) => {
        ev?.preventDefault();
        try {
            // Getting current selection and validating
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) return;

            // Creating temporary container for cloned content
            const range = selection.getRangeAt(0);
            const tempSpan = document.createElement('span');
            const clonedContent = range.cloneContents();
            tempSpan.appendChild(clonedContent);

            // Getting common ancestor container
            const commonAncestor = range.commonAncestorContainer.nodeType === ELEMENT_NODE
                ? range.commonAncestorContainer as HTMLElement
                : range.commonAncestorContainer.parentElement;

            if (commonAncestor) {
                // Extracting computed styles from common ancestor
                const computedStyles = window.getComputedStyle(commonAncestor);

                // Essential styles ###Remember note : make dynamic according to props
                const essentialStyles = {
                    fontWeight: computedStyles.fontWeight,
                    fontSize: computedStyles.fontSize,
                    fontStyle: computedStyles.fontStyle,
                    textDecoration: 'unset',
                };
                essentialStyles.textDecoration = computedStyles.textDecoration.split(' ')[0]// Extracting only decoration type (first value)

                const styleEntries = Object.entries(essentialStyles)
                // Converting to kebab-case CSS properties
                const styleString = styleEntries
                    .map(([prop, value]) => `${camelToKebabCase(prop)}: ${value}`)
                    .join('; ');

                // Merging cloned content styles with ancestor styles
                tempSpan.setAttribute('style', styleString) // Adding the full style string
            }

            // Updating state and clipboard
            const text = selection.toString();
            setCopiedContent({
                tempSpan,
                selectedNodes: selectionObj?.nodesStartToEnd || [],
                text
            });
            ev?.clipboardData?.setData('text/plain', text);

        } catch (error) {
            console.error('Error during copy handling:', error);
        }
    };

    const handleOnPaste = (ev?: React.ClipboardEvent<HTMLDivElement>) => {
        // Here paramater 'text' will be used to add symbols or particular text directly from parameter
        ev?.preventDefault();
        try {
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;

            const range = selection.getRangeAt(0);

            // Getting paste content (priority order)
            // here text priority first, then clipBoard text, so that we don't miss that
            const tempSpan = copiedContent?.tempSpan ? copiedContent.tempSpan.cloneNode(true) : null
            const pastedContent: HTMLElement | Node | null = tempSpan || document.createTextNode(ev?.clipboardData.getData('text/plain') || '') || null;

            // Inserting content with proper caret positioning
            if (pastedContent) {
                // Splitting the range if needed for inline insertion
                if (range.startContainer.nodeType === TEXT_NODE) {
                    const textNode = range.startContainer as Text;
                    const offset = range.startOffset;
                    const remainingText = textNode.splitText(offset);

                    // Inserting between split text nodes
                    textNode.parentNode?.insertBefore(pastedContent, remainingText);
                } else {
                    range.insertNode(pastedContent);
                }

                // If pasted non-text node and have text-decoratoin: none, then fixing text-decoration stylings
                const shouldWrapTxtNodes = pastedContent.nodeType === ELEMENT_NODE && (pastedContent as HTMLElement)?.style?.getPropertyValue('text-decoration') === 'none' && !getWillTxtDecNoneWork(pastedContent as HTMLElement)
                if (shouldWrapTxtNodes) {
                    const children: ChildNode[] = Array.from(pastedContent.childNodes) as ChildNode[];
                    children.forEach((child: ChildNode) => {
                        if (child.nodeType === TEXT_NODE) {
                            const wrapper = document.createElement('span');
                            wrapper.style.setProperty('text-decoration', 'none');
                            wrapper.style.setProperty('display', 'inline-block');

                            // Using ChildNode interface methods
                            child.before(wrapper);
                            wrapper.appendChild(child);
                        }
                    });
                }

                // Set selection around pasted content
                const newRange = document.createRange();
                newRange.selectNodeContents(pastedContent);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }

            setCurrentHTMLNodes(getHTMLToNodeBioObjs(id))
            saveInHistory()
            // handleOnSelect(); // test if necessary to run here handleOnSelect(), uncomment it

        } catch (error) {
            console.error('Paste failed:', error);
            // Restore previous state
            window.getSelection()?.removeAllRanges();
        }
    };

    const handleTextStyle = useCallback((styleProp: string, styledVal: string) => {
        try {
            if (!selectionObj) return;

            const nodesStartToEnd = selectionObj.nodesStartToEnd;

            let index = 0;
            let rangeStart: [Node, number] = [document.createTextNode(''), 0];
            let rangeEnd: [Node, number] = [document.createTextNode(''), 0];
            while (nodesStartToEnd.length > index) {
                const nodeObj = nodesStartToEnd[index];
                const { isFullySelected, node } = nodeObj;

                if (node.nodeType === TEXT_NODE) {
                    if (isFullySelected) {
                        const parent = node.parentElement; // text node's parent (a SPAN | the main DIV)

                        if (parent?.nodeName === 'DIV') {
                            // Handling DIV (main div) case
                            const span = document.createElement('span');
                            span.style.setProperty(styleProp, styledVal);
                            const newTextNode = document.createTextNode(node.textContent || '');
                            parent.replaceChild(span, node);
                            span.appendChild(newTextNode);

                            if (index === 0) {
                                rangeStart = [newTextNode, 0];
                            }
                            rangeEnd = [newTextNode, newTextNode.textContent!.length];
                        } else {
                            // Handling SPAN parent case
                            const refNode = styleProp === 'text-decoration' ?
                                applyTxtDecStylingToElm({
                                    span: parent as HTMLSpanElement,
                                    textNode: node as Text,
                                    value: styledVal as 'underline' | 'none'
                                }) :
                                applyStylingToElm({
                                    span: parent as HTMLSpanElement,
                                    textNode: node as Text,
                                    styleProp,
                                    styledVal,
                                });
                            const targetNode = refNode.node.nodeType === TEXT_NODE ? refNode.node : node;

                            if (index === 0) {
                                rangeStart = [targetNode, refNode.startOffset || 0];
                            }
                            rangeEnd = [targetNode, refNode.endOffset || 0];
                        }
                    } else {
                        // Handling partial selection
                        const { selectFromIndex = 0, selectToIndex = 0 } = nodeObj;
                        const textContent = node.textContent || '';
                        const beforeText = textContent.substring(0, selectFromIndex);
                        const selectedText = textContent.substring(selectFromIndex, selectToIndex);
                        const afterText = textContent.substring(selectToIndex);

                        const span = document.createElement('span');
                        const newTextNode = document.createTextNode(selectedText);
                        span.append(newTextNode);
                        span.style.setProperty(styleProp, styledVal)
                        if (styledVal === 'none' && styleProp === 'text-decoration') span.style['display'] = 'inline-block'

                        const childrenQueue: Node[] = [];
                        if (beforeText) childrenQueue.push(document.createTextNode(beforeText));
                        childrenQueue.push(span);
                        if (afterText) childrenQueue.push(document.createTextNode(afterText));

                        (node as Text).replaceWith(...childrenQueue);
                        node?.parentElement?.normalize();

                        if (index === 0) {
                            rangeStart = [newTextNode, 0];
                        }
                        rangeEnd = [newTextNode, newTextNode.textContent!.length];
                    }
                }
                index++;
            }

            // Restore selection
            const selection = window.getSelection();
            selection?.removeAllRanges();
            const range = new Range();
            range.setStart(rangeStart[0], rangeStart[1]);
            range.setEnd(rangeEnd[0], rangeEnd[1]);
            selection?.addRange(range);

            // Update state
            setCurrentHTMLNodes(getHTMLToNodeBioObjs(id));
            saveInHistory()
            handleOnSelect();
        } catch (error) {
            console.error(`Error in handleTextStyle:`, error);
        }
    }, [selectionObj, id, saveInHistory, handleOnSelect]);

    const handleClickOnSymbol = (symbol: string) => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        range.deleteContents(); // Removing any selected content


        const textNode = document.createTextNode(symbol);
        range.insertNode(textNode);

        // Moving the cursor after the inserted symbol
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);

        // Update state and trigger re-render
        setCurrentHTMLNodes(getHTMLToNodeBioObjs(id));
        saveInHistory()
    };


    return (
        <div
            tabIndex={0}
            className={`w-full p-2 my-1 flex flex-col items-center justify-center gap-4 bg-white text-gray-900 outline-1 outline transition-all rounded-lg max-h-[420px] ${nowFocus ? "outline-gray-600" : 'outline-gray-400 outline-dashed'} z-10`}
            onFocus={handleOnFocus}
            onBlur={handleOnBlur}
            {...parentDivProps}
        >
            {/* topbar */}
            <div className='grid grid-cols-[1fr_2fr] w-full justify-center items-center select-none'>
                {/* Symbols hoverable and symbols */}
                <div className="group relative flex items-center justify-center h-[30px] w-[100px] bg rounded-sm">
                    <button
                        className="flex items-center justify-center px-2 rounded-md bg-gray-100 hover:bg-gray-300 outline outline-1 outline-gray-400 transition-all h-[26px]"
                    >Symbols</button>
                    <div
                        className={`symbols absolute top-0 left-[100px] px-1 bg-white shadow-md transition-all duration-200 ease-in-out w-[0px] h-[0px] invisible opacity-0 group-hover:w-auto group-hover:h-auto group-hover:visible group-hover:opacity-100 flex items-center justify-center flex-wrap`}
                    >
                        {Symbols.map(({ text }, index) => (
                            <button
                                key={index}
                                className="w-[32px] h-[32px] text-[1.1rem] lg:text-[1.2rem] border border-gray-500 rounded-sm hover:bg-gray-300"
                                onClick={() => handleClickOnSymbol(text)}
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toolbars */}
                <div className="w-full h-[40px] flex flex-wrap items-center justify-end gap-[4%] pr-4 bg-transparent" {...textToolsDivProps}>
                    <button
                        title={isBoldActive ? 'Make unbold' : 'Make bold'}
                        className={classNames("px-2 py-1 border rounded hover:bg-gray-300", isBoldActive ? "bg-gray-300" : "bg-gray-100")}
                        onClick={() => {
                            handleTextStyle('font-weight', (isBoldActive ? fontWeight.normal : fontWeight.bold).toString())
                        }}
                    >
                        <RxFontBold />
                    </button>
                    <button
                        title={isItalicActive ? 'Make normal' : 'Make italic'}
                        className={classNames("px-2 py-1 border rounded hover:bg-gray-300", isItalicActive ? "bg-gray-300" : "bg-gray-100")}
                        onClick={() => {
                            handleTextStyle('font-style', isItalicActive ? 'normal' : 'italic')
                        }}
                    >
                        <RxFontItalic />
                    </button>
                    <button
                        title={isUnderlineActive ? 'Remove underline' : 'Add underline'}
                        className={classNames("px-2 py-1 border rounded hover:bg-gray-300", isUnderlineActive ? "bg-gray-300" : "bg-gray-100")}
                        onClick={() => {
                            handleTextStyle('text-decoration', isUnderlineActive ? 'none' : 'underline')
                        }}
                    >
                        <RxUnderline />
                    </button>
                    <button
                        title={allowFontPlus ? '' : 'Increase font size'}
                        disabled={!allowFontPlus}
                        className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-300"
                        onClick={() => {
                            handleTextStyle('font-size', allowFontPlus as string)
                        }}
                    >
                        <MdOutlineTextIncrease />
                    </button>
                    <button
                        title={allowFontMinus ? '' : 'Dicrease font size'}
                        disabled={!allowFontMinus}
                        className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-300"
                        onClick={() => {
                            handleTextStyle('font-size', allowFontMinus as string)
                        }}
                    >
                        <MdOutlineTextDecrease />
                    </button>
                </div>
            </div>

            {/* Editable Div */}
            <div
                ref={editableDiv}
                translate={allowTranslate ? 'yes' : 'no'}
                contentEditable
                className={className + " outline-none border-none text-left w-full max-h-[420px] overflow-y-scroll custom-scrollbar-css-sm __editable__DIV_Unique__"}
                onPaste={handleOnPaste}
                onSelect={handleOnSelect}
                onCopy={handleOnCopy}
                onInput={handleOnInput}
                onKeyDown={handleKeyDown}
                style={{ fontSize: fontSize.default, fontWeight: fontWeight.normal, fontStyle: 'normal', textDecoration: 'none' }}
                {...props}
                id={id}
            />

            {/* Credit Count */}
            <div ref={creditCountBox} className="w-full h-auto flex justify-end items-center gap-6 text-[1rem] transition-all select-none text-sm mt-1" {...textCreditCountDivProps}>
                {showCharCount &&
                    <div className="flex items-center justify-center">
                        <span>Text count {(editableDiv.current?.textContent || '').length}</span>
                    </div>}
                <div className="flex items-center justify-center space-x-[1px]">
                    <div className="relative group px-0.5">
                        <MdHelpOutline className="text-gray-300 text-xl cursor-pointer" />
                        <p className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-[200px] lg:w-[220px] text-center text-white bg-gray-800 text-[12px] p-1 leading-snug rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
                            Credit limit is a score type limitation based on styles density and deepness
                        </p>
                    </div>
                    <span>
                        Credit limit
                        <span className={currentCredit > creditLimit ? 'text-red-500' : ''}> {currentCredit} </span>
                    </span>
                    <span>/</span>
                    <span>{creditLimit}</span>
                </div>
            </div>
        </div >
    );
});

export default memo(EditableTextBox);