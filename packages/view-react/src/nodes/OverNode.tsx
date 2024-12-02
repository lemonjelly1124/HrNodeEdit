/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Handle, Position } from "reactflow";

import { useState, useRef, useEffect } from 'react';
import './Node.css';
import NodeMenu from "../components/NodeMenu";
import SubButton from "../components/SubButton";
import stopIcon from '/stop.svg';
import flipIcon from '/flip.svg';
import NodeState from '../components/NodeState';
import EditLabel from "../components/EditLabel";
import { useWebviewPublicPath } from '../hooks/use-webview-public-path';
//创建随机id
export const OverNode = ({ data, id }: any) => {
    const [stopIconPath] = useWebviewPublicPath(stopIcon)
    const [flipIconPath] = useWebviewPublicPath(flipIcon)
    const { onNodeListClick, onNodeStateChanged, onSwappedBtnClick, onNodeDoubleClick, onNodeTitleChange } = data;
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [isSubBtnVisible, setIsSubBtnVisible] = useState<boolean>(false);
    const [popup, setPopup] = useState<{ x: number; y: number, isStopHide: boolean }>({ x: 0, y: 0, isStopHide: true });
    const componentRef = useRef<HTMLDivElement | null>(null);
    const [Running, setRunning] = useState(data.isRunning);
    const [Subthread, setSubthread] = useState(data.isSubthread);
    const [Normal, setNormal] = useState(data.isNormal);
    const [title, setTitle] = useState(data.title);
    const [content, setContent] = useState(data.content);
    const editTitle = (newValue: string) => {
        data.title = newValue;
        setTitle(newValue);
    };
    const handleTitleChanged = (oldValue: string, newValue: string) => {
        const node = { id: id, oldtitle: oldValue, newtitle: newValue };
        if (newValue === '') {
            setTitle(oldValue);
            data.title = oldValue;
        } else {
            if (onNodeTitleChange) {
                onNodeTitleChange(node);
            }
        }

    }
    const handleContentChanged = (oldValue: string, newValue: string) => {
        if (newValue === '') {
            setContent("备注");
            data.title = "备注";
        }
    }
    const editContent = (newValue: string) => {
        data.content = newValue;
        setContent(newValue);
    };

    const onHandleClick = () => {
        if (!data.isSwapped) {
            setPopup({ x: -70, y: -130, isStopHide: true });
        }
        else {
            setPopup({ x: -70, y: 165, isStopHide: true });
        }
        setIsVisible(true);
    }
    const nodeListClick = (nodeType: string) => {
        setIsVisible(false);
        onNodeListClick(id, nodeType, 'left', '0');
    }

    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsSubBtnVisible(true);
    }
    // const handleSubBtnClick = () => {
    //     if (onSubBtnClick) {
    //         onSubBtnClick(id);
    //     }
    // }

    const handleSwitchBtnClick = () => {
        if (onSwappedBtnClick) {
            onSwappedBtnClick(id, data.isSwapped);
        }
    }
    const handleDoubleClick = () => {
        if (onNodeDoubleClick) {
            const node = {
                id: id,
                data: {
                    title: data.title,
                }
            }
            onNodeDoubleClick(node);
        }
    }

    const handleStatusChange = (status: { isRunning: boolean; isSubThread: boolean; isNormal: boolean }) => {
        if (status.isRunning !== undefined) {
            data.isRunning = status.isRunning;
            setRunning(status.isRunning);
        }
        if (status.isSubThread !== undefined) {
            data.isSubthread = status.isSubThread;
            setSubthread(status.isSubThread);
        }
        if (status.isNormal !== undefined) {
            data.isNormal = status.isNormal;
            setNormal(status.isNormal);
        }
        if (onNodeStateChanged) {
            onNodeStateChanged(id, status);
        }
    };
    useEffect(() => {
        if ((isSubBtnVisible || isVisible) && componentRef.current) {
            componentRef.current.focus(); // 将焦点设置到自定义组件
        }
    }, [isVisible, isSubBtnVisible]);

    const handleComponentBlur = (event: React.FocusEvent<HTMLDivElement>) => {
        // 仅当焦点移出组件时隐藏
        if (componentRef.current && !componentRef.current.contains(event.relatedTarget)) {
            setIsVisible(false);
            setIsSubBtnVisible(false);
        }
    };

    return (
        <div className='node' onContextMenu={handleContextMenu} >
            <div className='node-title' onDoubleClick={handleDoubleClick}>
                <img src={stopIconPath} className='node-icon' />
                <EditLabel Value={title} type="title" onEdit={editTitle} onValueChanged={handleTitleChanged} />
            </div>
            <div onDoubleClick={handleDoubleClick}>
                <EditLabel Value={content} type="content" onEdit={editContent} onValueChanged={handleContentChanged} />
                </div>
            
            <div className="node-state">
                <NodeState isRunning={Running} isSubThread={Subthread} isNormal={Normal} onStatusChange={handleStatusChange} isSubBtnHide={true} />
            </div>

            <Handle className="node-handle-t" type="target" position={data.isSwapped ? Position.Right : Position.Left} style={{ top: '50%' }} isConnectable={true} onMouseEnter={onHandleClick} />
            {isVisible && (
                <div ref={componentRef} onBlur={handleComponentBlur} tabIndex={0} style={{ position: 'relative' }}>
                    <NodeMenu x={popup.x} y={popup.y} isStopHide={popup.isStopHide} onButtonClick={nodeListClick} />
                </div>
            )}
            {isSubBtnVisible && (
                <div ref={componentRef} onBlur={handleComponentBlur} tabIndex={0} style={{ position: 'relative' }}>
                    <SubButton x={-30} y={57} imgPath={flipIconPath} text="翻转" onButtonClick={handleSwitchBtnClick} />
                </div>
            )}
        </div>
    );
}
