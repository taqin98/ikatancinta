import TL from "../assets/decorations/flower-01.webp";
import TR from "../assets/decorations/flower-02.webp";
import BL from "../assets/decorations/flower-01.webp";
import BR from "../assets/decorations/flower-02.webp";

const MAP = {
    tl: TL,
    tr: TR,
    bl: BL,
    br: BR,
};

export default function OrnamentCorner({
    corner = "tl",
    width = "160px",
    opacity = 0.9,
    mirrorX = false,
    mirrorY = false,
    style = {},
}) {
    const src = MAP[corner] || TL;
    const transforms = [];
    if (mirrorX) transforms.push("scaleX(-1)");
    if (mirrorY) transforms.push("scaleY(-1)");
    return (
        <img
            src={src}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none"
            style={{ width, opacity, display: "block", transform: transforms.length > 0 ? transforms.join(" ") : undefined, ...style }}
        />
    );
}
