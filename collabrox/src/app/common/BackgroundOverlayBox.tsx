
/**
 * IMPORTANT : children must be higher zIndex than this components zIndex (default : 1)
 * @param children - ReactNode children
 * @param darkness - {default : .20} Darknesss point of background, means how much darkness density should be in background
 * @param zIndex - {default : 1} zIndex to set for this component, must be be more than children | childrens
 * @param allowPointer - {default : true} Weather or not outside of box the cursor should be shown
 * @returns React.ReactNode with wrapping the children
 */
const BackgroundOverlayBox = ({ children, darkness = .20, zIndex = 1, allowPointer = true }: { children: React.ReactNode, darkness?: .10 | .20 | .30 | .40 | .50, zIndex?: number, allowPointer?: boolean }) => {
    return (
        <div
            className='fixed inset-0 w-screen h-screen flex items-center justify-center transition-opacity duration-300'
            style={{ background: `rgba(0,0,0,${darkness})`, zIndex, pointerEvents: allowPointer ? 'auto' : 'none' }}
        >
            {children}
        </div>
    )
}

export default BackgroundOverlayBox
