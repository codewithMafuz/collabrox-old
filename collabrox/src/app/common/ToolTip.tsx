
export interface TooltipProps {
  /** 
   * The content to be displayed inside the tooltip.
   * 
   * It can be a string or a React node.
   */
  content?: string | React.ReactNode;
  /** 
   * The children which will trigger this tooltip (generally icon or button).
   */
  children?: React.ReactNode;
  /** 
   * Custom styles for the tooltip container.
   */
  style?: React.CSSProperties;
  /** 
   * Additional CSS or Tailwind CSS classes for styling a Div that will indirectly style the tooltip content box and tooltip arrow (the div wrapped anothe div, and the another div wrapped both content and arrow).
   * 
   * Supports all Tailwind classes and Content box special classes are: 
   * - position-{theSide} - `position-top`, `position-bottom`, `position-left`, `position-right`
   *
   * - tooltip-{alignSide} - `tooltip-align-left`, `tooltip-align-right`
   */
  className?: string;
  /** 
   * Additional CSS or Tailwind CSS classes for styling the main and common ancestor of all (children, tooltip and arrow).
   * 
   * Supports all Tailwind classes
   */
  parentClassName?: string;
  /** 
   * Determine which side Arrow shape should appear with respect to content box, also can be set to push leftwards or rightwards if position is either top or bottom, otherwise by default centered.
   * 
   * Additional CSS or Tailwind CSS classes for styling the tooltip arrow.
   * 
   * Supports all Tailwind classes and Toltip arrow special classes are :
   * - `topside-middle`, `topside-left`, `topside-right`, `bottomside-middle`, `bottomside-left`, `bottomside-right`, `leftside-middle`, `rightside-middle`
   * 
   * Can be hidden by adding Tailwind CSS class `hidden`
   */
  arrowClassName?: string;
}


/**
 * A highly customizable tooltip component for React, styled and positioned using Tailwind CSS.
 *
 * This component provides flexible tooltip placement, alignment, and arrow indicators.
 * It relies on a custom Tailwind CSS plugin to generate positioning and styling utility classes.
 * These classes are then applied to the *structure* of your React component to achieve the desired tooltip behavior.
 *
 * Key Features:
 * - Configurable tooltip placement (top, bottom, left, right) relative to a parent element.
 * - Alignment options for top and bottom tooltips (left, center, right).
 * - Provides arrow's placement based classes determines towards position with respect to content center.
 * - Can be used responsive figures like sm: md: lg: etc that supported my tailwind css.
 *
 * Installation and Usage:
 *
 * 1. Add the following plugin to the `plugins` array in your `tailwind.config.js` file.
 * This plugin defines the utility classes necessary for tooltip positioning, alignment, and arrow styling.
 *
 * ```javascript
  plugins: [
    function ({ addUtilities }) {
      const tooltipUtilities = {
        // Position classes
        '.position-top': {
          bottom: 'calc(100% + 5px)',
          left: '50%',
          top: 'auto',
          right: 'auto',
          translate: '-50% 0',
        },
        '.position-bottom': {
          top: 'calc(100% + 5px)',
          left: '50%',
          bottom: 'auto',
          right: 'auto',
          translate: '-50% 0',
        },
        '.position-left': {
          right: 'calc(100% + 5px)',
          top: '50%',
          left: 'auto',
          bottom: 'auto',
          translate: '0 -50%',
        },
        '.position-right': {
          left: 'calc(100% + 5px)',
          top: '50%',
          right: 'auto',
          bottom: 'auto',
          translate: '0 -50%',
        },
        // Alignment classes (only for top/bottom)
        '.tooltip-align-left': {
          left: '100%',
          translate: '-100% 0',
        },

        '.tooltip-align-right': {
          left: '0%',
          translate: '0 0',
        },
        // Arrow classes
        '.topside-middle': {
          top: '-3px',
          bottom: 'auto',
          left: '50%',
          translate: '-50% 0',
          rotate: '45deg',
        },
        '.topside-right': {
          top: '-3px',
          bottom: 'auto',
          left: 'auto',
          right: '0',
          translate: 'calc(50% - 5px) 0',
          rotate: '45deg',
        },
        '.topside-left': {
          top: '-3px',
          bottom: 'auto',
          left: '0',
          right: 'auto',
          translate: 'calc(-50% + 5px) 0',
          rotate: '45deg',
        },
        '.bottomside-middle': {
          top: 'auto',
          bottom: '-3px',
          left: '50%',
          translate: '-50% 0',
          rotate: '45deg',
        },
        '.bottomside-right': {
          top: 'auto',
          bottom: '-3px',
          left: 'auto',
          right: '0',
          translate: '-50% 0',
          rotate: '45deg',
        },
        '.bottomside-left': {
          top: 'auto',
          bottom: '-3px',
          left: '0',
          right: 'auto',
          translate: 'calc(-50% + 5px) 0',
          rotate: '45deg',
        },
        '.leftside-middle': {
          left: '-3px',
          right: 'auto',
          top: '50%',
          translate: '0 -50%',
          rotate: '45deg',
        },
        '.rightside-middle': {
          left: 'auto',
          right: '-3px',
          top: '50%',
          translate: '0 -50%',
          rotate: '45deg',
        },
      };

      addUtilities(tooltipUtilities, ['responsive']);
    }
  ]
 * ```
 */

const Tooltip = ({
  content,
  children,
  parentClassName = '',
  className = 'position-top',
  arrowClassName = 'topside-middle'
}: TooltipProps) => {

  return (
    content && children ?
      <div className={`group relative inline-block animate-fadeIn ${parentClassName}`}>
        {children}
        <div
          className={`opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto absolute z-50 transition-opacity duration-200 group-hover:delay-500 ${className}`}
        >
          <div className="w-max max-w-sm bg-gray-900 text-gray-100 px-3 py-0.5 rounded-md shadow-md text-sm relative">
            {content}
            <div className={`absolute bg-gray-900 rounded-sm w-2 h-2 ${arrowClassName}`} />
          </div>
        </div>
      </div>
      :
      <>{children}</>
  );
}

export default Tooltip