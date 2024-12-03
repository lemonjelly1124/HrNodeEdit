/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Handle, Position } from "reactflow";
import { useState, useRef, useEffect } from 'react';
import './Node.css';
import NodeMenu from "../components/NodeMenu";
import SubButton from "../components/SubButton";
import judgeIcon from '/judge.svg';
import flipIcon from '/flip.svg';
import threadIcon from '/thread.svg';
import NodeState from '../components/NodeState';
import EditLabel from "../components/EditLabel";
import { useWebviewPublicPath } from '../hooks/use-webview-public-path';

export const JudgeNode = ({ data, id,selected }: any) => {
    const [judgeIconPath] = useWebviewPublicPath(judgeIcon)
    const [flipIconPath] = useWebviewPublicPath(flipIcon)
    const [threadIconPath] = useWebviewPublicPath(threadIcon)
    const { onSubBtnClick, onNodeListClick, onNodeStateChanged, onSwappedBtnClick, onNodeDoubleClick, onNodeTitleChange } = data;
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [isSubBtnVisible, setIsSubBtnVisible] = useState<boolean>(false);
    const [popup, setPopup] = useState<{ x: number; y: number, isStopHide: boolean, isStartHide: boolean }>({ x: 0, y: 0, isStopHide: true, isStartHide: true });
    const componentRef = useRef<HTMLDivElement | null>(null);
    const [curHandleId, setCurHandleId] = useState<string>();
    const [curHandlePos, setCurHandlePos] = useState<Position>(Position.Right);

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

    const onLeftHandleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        setCurHandlePos(Position.Left);
        setCurHandleId(event.currentTarget.dataset.handleid)
        if (!data.isSwapped) {
            setPopup({ x: -70, y: -130, isStopHide: true, isStartHide: false });
        } else {
            setPopup({ x: -70, y: 165, isStopHide: true, isStartHide: false });
        }
        setIsVisible(true);
    }
    const onRightHandleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        setCurHandlePos(Position.Right);
        setCurHandleId(event.currentTarget.dataset.handleid)
        if (!data.isSwapped) {
            setPopup({ x: -70, y: 165, isStopHide: false, isStartHide: true });
        } else {
            setPopup({ x: -70, y: -130, isStopHide: false, isStartHide: true });
        }
        setIsVisible(true);
    }

    const nodeListClick = (nodeType: string) => {
        setIsVisible(false);
        if (curHandlePos === Position.Left) {
            onNodeListClick(id, nodeType, 'left', '0');
        } else {
            onNodeListClick(id, nodeType, 'right', curHandleId);
        }
    }
    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsSubBtnVisible(true);
    }
    const handleSubBtnClick = () => {
        data.isSubthread = true;
        setSubthread(true);
        if (onSubBtnClick) {
            onSubBtnClick(id);
        }
    }
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
        <div className={selected ? 'node-selected' : 'node'} onContextMenu={handleContextMenu} >
            <div className="node-top" onDoubleClick={handleDoubleClick}>
                {data.isSwapped && <div className="node-targetlabel">
                    <label node-targetlabel>Y</label>
                    <label node-targetlabel>N</label>
                </div>}
                <div className="node-title-div">
                    <div className='node-title'>
                        <img src={judgeIconPath} className='node-icon' />
                        <EditLabel Value={title} type="title" onEdit={editTitle} onValueChanged={handleTitleChanged} />
                    </div>
                        <EditLabel Value={content} type="content" onEdit={editContent} onValueChanged={handleContentChanged} />
                </div>
                {!data.isSwapped && <div className="node-targetlabel">
                    <label node-targetlabel>Y</label>
                    <label node-targetlabel>N</label>
                </div>}
            </div>
            <div className="node-state">
                <NodeState isRunning={Running} isSubThread={Subthread} isNormal={Normal} onStatusChange={handleStatusChange} />
            </div>
            <Handle className="node-handle-s" type="source" position={data.isSwapped ? Position.Left : Position.Right} style={{ top: '32px' }} isConnectable={true} onMouseEnter={onRightHandleClick} />
            <Handle className="node-handle-s" type="source" position={data.isSwapped ? Position.Left : Position.Right} style={{ top: '62px' }} isConnectable={true} onMouseEnter={onRightHandleClick} />
            <Handle className="node-handle-t" type="target" position={data.isSwapped ? Position.Right : Position.Left} style={{ top: '47px' }} isConnectable={true} onMouseEnter={onLeftHandleClick} />
            {isVisible && (
                <div ref={componentRef} onBlur={handleComponentBlur} tabIndex={0} style={{ position: 'relative' }}>
                    <NodeMenu x={popup.x} y={popup.y} isStopHide={popup.isStopHide} isStartHide={popup.isStartHide} onButtonClick={nodeListClick} />
                </div>
            )}
            {isSubBtnVisible && (
                <div ref={componentRef} onBlur={handleComponentBlur} tabIndex={0} style={{ position: 'relative' }}>
                    <SubButton x={-30} y={20} imgPath={threadIconPath} text="子线程" onButtonClick={handleSubBtnClick} />
                    <SubButton x={-30} y={90} imgPath={flipIconPath} text="翻转" onButtonClick={handleSwitchBtnClick} />
                </div>
            )}
        </div>
    );
};
