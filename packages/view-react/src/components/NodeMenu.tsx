import React from "react";
import './NodeMenu.css'
import { useWebviewPublicPath } from '../hooks/use-webview-public-path';
import startIcon from '/start.svg';
import stopIcon from '/stop.svg';
import switchIcon from '/switch.svg';
import judgeIcon from '/judge.svg';
import processIcon from '/process.svg';
interface NodeListProps {
    x: number;
    y: number;
    isStartHide?: boolean;
    isStopHide?: boolean;
    onButtonClick: (nodeType: string) => void;
}
const NodeMenu: React.FC<NodeListProps> = (props) => {
    const [startIconPath] = useWebviewPublicPath(startIcon)
    const [stopIconPath] = useWebviewPublicPath(stopIcon)
    const [switchIconPath] = useWebviewPublicPath(switchIcon)
    const [judgeIconPath] = useWebviewPublicPath(judgeIcon)
    const [processIconPath] = useWebviewPublicPath(processIcon)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { x, y, isStartHide, isStopHide, onButtonClick } = props;
    const onNodeTypeClick = (nodeType: string) => {
        onButtonClick(nodeType);
    }
    return (

        <div className="nodemenu-content" style={{ position: "fixed", top: x, left: y }}>
            {!isStartHide && (
                <div className="nodemenu-content-item" onClick={() => onNodeTypeClick('StartNode')} draggable>
                    <img src={startIconPath} className="nodemenu-content-item-icon"></img>
                    <div className="nodemenu-content-item-text">Start Node</div>
                </div>
            )}
            {!isStopHide && (
                <div className="nodemenu-content-item" onClick={() => onNodeTypeClick('OverNode')} draggable>
                    <img src={stopIconPath} className="nodemenu-content-item-icon"></img>
                    <div className="nodemenu-content-item-text">Over Node</div>
                </div>
            )}
            <div className="nodemenu-content-item" onClick={() => onNodeTypeClick('SwitchNode')} draggable>
                <img src={switchIconPath} className="nodemenu-content-item-icon"></img>
                <div className="nodemenu-content-item-text">Switch Node</div>
            </div>
            <div className="nodemenu-content-item" onClick={() => onNodeTypeClick('JudgeNode')} draggable>
                <img src={judgeIconPath} className="nodemenu-content-item-icon"></img>
                <div className="nodemenu-content-item-text">Judge Node</div>
            </div>
            <div className="nodemenu-content-item" onClick={() => onNodeTypeClick('ProcessNode')} draggable>
                <img src={processIconPath} className="nodemenu-content-item-icon"></img>
                <div className="nodemenu-content-item-text">Process Node</div>
            </div>

        </div>

    );
};

export default NodeMenu;