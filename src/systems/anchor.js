export function computeAnchorPosition({ anchor, viewport, elementSize, offsetBottom }) {
    if (anchor === 'bottom') {
        return {
            x: 0,
            y: viewport.height - elementSize.height - (offsetBottom || 0)
        };
    }

    return { x: 0, y: 0 };
}
