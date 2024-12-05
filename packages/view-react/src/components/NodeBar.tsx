import "./NodeBar.css";
import { useState } from "react";
import { useWebviewPublicPath } from '../hooks/use-webview-public-path';
import foldIcon from '/fold.svg';
import unfoldIcon from '/unfold.svg';
import startIcon from '/start.svg';
import stopIcon from '/stop.svg';
import switchIcon from '/switch.svg';
import judgeIcon from '/judge.svg';
import processIcon from '/process.svg';
interface NodeBar {
    theme?: string;
}
const NodeBar: React.FC<NodeBar> = (props) => {
    const [open, setOpen] = useState(false);
    const [foldIconPath] = useWebviewPublicPath(foldIcon)
    const [unfoldIconPath] = useWebviewPublicPath(unfoldIcon)
    const [startIconPath] = useWebviewPublicPath(startIcon)
    const [stopIconPath] = useWebviewPublicPath(stopIcon)
    const [switchIconPath] = useWebviewPublicPath(switchIcon)
    const [judgeIconPath] = useWebviewPublicPath(judgeIcon)
    const [processIconPath] = useWebviewPublicPath(processIcon)
    const { theme } = props;

    const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <div className={`nodebar ${theme}`} style={{ position: "fixed", top: 40, left: 40 }}>
            <div className="nodebar-title" onClick={() => setOpen(!open)}>
                <label className="nodebar-title-text" >NODES</label>
                <img src={open ? foldIconPath : unfoldIconPath} className="nodebar-title-icon" />
            </div>
            <div>
                {open && (
                    <div className={`nodebar-content ${theme}`}>
                        <span className="nodebar-content-span">起始</span>
                        <div className={`nodebar-content-item ${theme}`} onDragStart={(event) => onDragStart(event, "StartNode")} draggable>
                            <img src={startIconPath} className="nodebar-content-item-icon"></img>
                            <div className={`nodebar-content-item-text ${theme}`}>Start Node</div>
                        </div>
                        <div className={`nodebar-content-item ${theme}`} onDragStart={(event) => onDragStart(event, "OverNode")} draggable>
                            <img src={stopIconPath} className="nodebar-content-item-icon"></img>
                            <div className={`nodebar-content-item-text ${theme}`}>Over Node</div>
                        </div>
                        <span className="nodebar-content-span">控制</span>
                        <div className={`nodebar-content-item ${theme}`} onDragStart={(event) => onDragStart(event, "SwitchNode")} draggable>
                            <img src={switchIconPath} className="nodebar-content-item-icon"></img>
                            <div className={`nodebar-content-item-text ${theme}`}>Switch Node</div>
                        </div>
                        <div className={`nodebar-content-item ${theme}`} onDragStart={(event) => onDragStart(event, "JudgeNode")} draggable>
                            <img src={judgeIconPath} className="nodebar-content-item-icon"></img>
                            <div className={`nodebar-content-item-text ${theme}`}>Judge Node</div>
                        </div>
                        <div className={`nodebar-content-item ${theme}`} onDragStart={(event) => onDragStart(event, "ProcessNode")} draggable>
                            <img src={processIconPath} className="nodebar-content-item-icon"></img>
                            <div className={`nodebar-content-item-text ${theme}`}>Process Node</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NodeBar;