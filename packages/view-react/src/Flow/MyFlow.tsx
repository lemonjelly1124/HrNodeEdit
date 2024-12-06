/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
import ReactFlow, { addEdge, Connection, Background, MiniMap, Controls, useEdgesState, useNodesState, BackgroundVariant } from 'reactflow';
import type { Node as ReactFlowNode } from "reactflow";
import 'reactflow/dist/style.css';
import { initialNodes, nodeTypes } from "../nodes";
import { initialEdges, edgeTypes } from "../edges";
import { useReactFlow } from 'reactflow';
import { useCallback, useState, useEffect } from 'react';
import dagre from "dagre";
import CryptoJS from 'crypto-js';
import { Position } from '@xyflow/react';
import NodeBar from '../components/NodeBar';
import "./MyFlow.css"

let vscode: ReturnType<typeof window.acquireVsCodeApi> | undefined;
const getVsCodeApi = () => {
    if (!vscode) {
        vscode = window.acquireVsCodeApi();
    }
    return vscode;
};

interface Node extends ReactFlowNode {
    id: string;
    position: { x: number; y: number };
    type: string;
    selected: boolean;
    data: {
        title: string;
        content: string;
        isRunning: boolean;
        isSubthread: boolean;
        isNormal: boolean;
        isSwapped: boolean;
        theme: string;
        onSubBtnClick: (id: string) => void;
        onSwappedBtnClick: (id: string, isSwapped: boolean) => void;
        onNodeListClick: (baseid: string, nodeType: string, position: string, handle: string) => void
        onNodeStateChanged: (id: string, state: any) => void;
        onNodeDoubleClick: (node: any) => void;
        onNodeTitleChange: (node: any) => void;
    };
}

interface Edge {
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
}

const nodeWidth = 150;
const nodeHeight = 90;
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: string) => {
    const isHorizontal = direction === "LR";
    dagreGraph.setGraph({ rankdir: direction });
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });
    dagre.layout(dagreGraph);
    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const newNode = {
            ...node,
            targetPosition: isHorizontal ? "left" : "top",
            sourcePosition: isHorizontal ? "right" : "bottom",
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2
            }
        };
        return newNode;
    });
    return { nodes: newNodes, edges };
};
//创建随机id
const generateUniqueId = () => `${Math.random().toString(36).substr(2, 7)}`;
let parentID = '';

const encryptionKey = 'secret-key'; // 加密密钥
// 加密并复制到剪切板
const encryptAndCopyToClipboard = async (text: string) => {
    const encryptedText = CryptoJS.AES.encrypt(text, encryptionKey).toString();
    await navigator.clipboard.writeText(encryptedText);
    console.log('Encrypted text copied to clipboard:', encryptedText);
};

// 从剪切板读取并解密
const decryptFromClipboard = async (): Promise<string> => {
    const encryptedText = await navigator.clipboard.readText();
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        return decryptedText;
    } catch (error) {
        console.error('Failed to decrypt clipboard text:', error);
        return "";
    }
};
const MyFlow = () => {
    const [theme, setTheme] = useState('');
    const [projectPath, setProjectPath] = useState('');
    const [projectDir, setProjectDir] = useState('');
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isNodeDrag, setIsNodeDrag] = useState(false);
    const [historyState, setHistoryState] = useState(0);    //当状态为0和1时表示操作会被记录，为1时表示按ctrl键保存最新状态,为2时表示跳过下次因操作触发的保存。
    const [historyArr, setHistoryArr] = useState<string[]>([]);
    const [isEdgeAnimated, setIsEdgeAnimated] = useState(false);
    const [selectionNodes, setSelectionNodes] = useState([]);
    const [selectionEdges, setSelectionEdges] = useState([]);
    const { screenToFlowPosition } = useReactFlow();
    const vscode = getVsCodeApi();
    const reactFlowInstance = useReactFlow();
    const [options, setOptions] = useState([]);
    const handleItemSelected = (id: number, title: string) => {
        vscode.postMessage({
            type: 'subthread',
            data: {
                id: id,
                title: title
            },
        });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const updateOptions = (nodes: any) => {
        const newOptions = nodes.map((node: any) => {
            return {
                id: node.id,
                title: node.data.title
            }
        });
        setOptions(newOptions);
    };
    const clearNode = useCallback(() => {
        setNodes([]);
        setEdges([]);
    }, [setEdges, setNodes]);

    const addHistory = useCallback(() => {
        const jsonObject = JSON.stringify({ nodes: nodes, edges: edges });
        if (historyIndex < historyArr.length) {
            historyArr.splice(historyIndex, historyArr.length - historyIndex);
        }
        historyArr.push(jsonObject);
        setHistoryIndex(historyArr.length);
    }, [edges, nodes, historyArr, historyIndex]);

    //新建项目节点文件
    const createNewNodeFile = () => {
        vscode.postMessage({
            type: 'createnodefile',
            data: {}
        });
    }

    //打开节点对应的代码文件
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const openCodeToExtension = (path: string) => {
        vscode.postMessage({
            type: 'opencode',
            data: { path: path },
        });
    }

    //保存所有节点的代码
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveCodeToExtension = (id: string, content: string) => {
        vscode.postMessage({
            type: 'savecode',
            data: { id: id, content: content },
        });
    }

    //导入节点
    const importNodeToExtension = () => {
        vscode.postMessage({
            type: 'importnode',
            data: {},
        });
    }

    //打开项目文件
    const openProjectToExtension = () => {
        vscode.postMessage({
            type: 'openproject',
            data: {},
        });
    }
    //设置为当前标签页
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const setPanelActive = (id: string) => {
        if (id === parentID) {
            vscode.postMessage({
                type: 'panelactiveback',
                data: { parentid: parentID },
            });
        }
    }

    //保存节点数据
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveNodeToExtension = () => {
        const newnodes = nodes.map((node) => {
            return {
                id: node.id,
                type: node.type,
                position: node.position,
                data: {
                    title: node.data.title,
                    content: node.data.content,
                    isRunning: node.data.isRunning,
                    isSubthread: node.data.isSubthread,
                    isNormal: node.data.isNormal,
                    isSwapped: node.data.isSwapped,
                }
            }
        })
        const flowObj = {
            nodes: newnodes,
            edges: edges,
            parentID: parentID
        };
        vscode.postMessage({
            type: 'savenode',
            data: flowObj,
        });
    }
    //通知extension保存所有打开界面的节点数据
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveAllNodeToExtension = () => {
        vscode.postMessage({
            type: 'saveallnode',
            data: ''
        });
    }
    //打开子线程
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const subThreadToExtension = (id: string) => {
        setNodes((nds) => {
            const node = nds.find(node => node.id === id);
            if (node) {
                vscode.postMessage({
                    type: 'subthread',
                    data: {
                        id: id,
                        title: node.data.title,
                        content: node.data.content,
                    },
                });
            }
            return nds;
        });
    }

    //节点当前状态
    const onNodeStateHandle = useCallback((id: string, state: any) => {
        setNodes((nds) => {
            const node = nds.find(node => node.id === id);
            if (node) {
                vscode.postMessage({
                    type: 'nodestatechanged',
                    data: {
                        parentid: parentID,
                        node: {
                            id: node.id,
                            type: node.type,
                            position: node.position,
                            title: node.data.title,
                            data: {
                                content: node.data.content,
                                isRunning: node.data.isRunning,
                                isSubthread: node.data.isSubthread,
                                isNormal: node.data.isNormal,
                                isSwapped: node.data.isSwapped,
                            }
                        }
                    },
                })
            }
            return nds;
        });
    }, [setNodes, vscode]);

    //翻转连接点
    const handleSwapBtnClick = useCallback((id: string, isSwapped: boolean) => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        sourcePosition: !isSwapped ? Position.Right : Position.Left,
                        targetPosition: !isSwapped ? Position.Left : Position.Right,
                        data: {
                            ...node.data,
                            isSwapped: !isSwapped,
                        },
                    };
                }
                return node;
            })
        );
    }, [setNodes]);

    //节点双击事件
    const handleNodeClick = useCallback((node: any) => {
        setProjectDir((p) => {
            openCodeToExtension(p + "\\" + node.data.title + '_' + node.id + ".py");
            return p;
        });
    }, [openCodeToExtension, setProjectDir]);

    //节点修改标题事件
    const handleNodeTitleChange = useCallback((node: any) => {
        vscode.postMessage({
            type: 'nodetitlechange',
            data: node,
        });
    }, [vscode]);

    //点击节点nodelist新建节点
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onNodeListClickHandle = useCallback((baseid: string, nodeType: string, position: string, handle: string) => {
        setNodes((nds) => {
            const node = nds.find(node => node.id === baseid);
            if (node) {
                let wx = 0;
                if (position === 'left') {
                    wx = node.position.x - 200
                } else {
                    wx = node.position.x + 200
                }
                const newNode = {
                    id: generateUniqueId(),
                    type: nodeType,
                    position: { x: wx, y: node.position.y },
                    selected: false,
                    data: {
                        title: nodeType,
                        content: `备注`,
                        isRunning: true,
                        isSubthread: false,
                        isNormal: true,
                        isSwapped: false,
                        theme: theme,
                        onSubBtnClick: subThreadToExtension,
                        onNodeListClick: onNodeListClickHandle,
                        onNodeStateChanged: onNodeStateHandle,
                        onSwappedBtnClick: handleSwapBtnClick,
                        onNodeDoubleClick: handleNodeClick,
                        onNodeTitleChange: handleNodeTitleChange
                    },
                };
                if (position === 'left') {
                    setEdges((edges) => {
                        return edges.concat({ id: `edges-` + generateUniqueId(), source: newNode.id, target: baseid, targetHandle: handle });
                    });
                } else {
                    setEdges((edges) => {
                        return edges.concat({ id: `edges-` + generateUniqueId(), source: baseid, sourceHandle: handle, target: newNode.id });
                    });
                }
                return nds.concat(newNode);
            }
            return nds;
        });
        addHistory();
    }, [addHistory, handleNodeClick, handleNodeTitleChange, handleSwapBtnClick, onNodeStateHandle, setEdges, setNodes, subThreadToExtension, theme]);


    const logInfo = () => {
        console.log(theme);
    }

    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);


    const handleNodesDelete = (changes: unknown) => {
        console.log('Nodes Delete:', changes);
        addHistory();
    }
    const handleNodesDragStart = () => {
        setIsNodeDrag(false);
    }
    const handleNodesDrag = () => {
        setIsNodeDrag(true);
    }
    const handleNodesDragStop = () => {
        if (isNodeDrag) {
            addHistory();
        }
    }
    const handleEdgesDelete = (_changes: unknown) => {
        addHistory();
    };
    const handleEdgesConnect = (changes: Edge | Connection) => {
        setEdges((edges) => addEdge(changes, edges));
        addHistory();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const centerNode = (nodeId: string) => {
        const node = reactFlowInstance.getNode(nodeId);
        if (node) {
            reactFlowInstance.setCenter(node.position.x + 100, node.position.y + 50, {
                zoom: 1.5, // 可选，设置缩放级别
                duration: 800, // 可选，设置动画时长（毫秒）
            });
            setNodes((nodes) =>
                nodes.map((n) => {
                    return {
                        ...n,
                        selected: false,
                    };
                })
            );
            setNodes((nodes) =>
                nodes.map((n) => {
                    if (n.id === nodeId) {
                        return {
                            ...n,
                            selected: true,
                        };
                    }
                    return n;
                })
            );
        } else {
            console.warn(`Node with id ${nodeId} not found.`);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onVsCodeThemeChange = (theme: string) => {
        setTheme(theme);
        setNodes((nodes) =>
            nodes.map((node) => {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        theme: theme,
                    },
                };
            })
        );
    }

    // 拖动添加节点
    const onDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            const type = event.dataTransfer.getData("application/reactflow");
            // 检查拖拽的元素是否有效
            if (typeof type === "undefined" || !type) {
                return;
            }
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNode: Node = {
                id: generateUniqueId(),
                type,
                position,
                selected: false,
                data: {
                    title: `${type}`,
                    content: `备注`,
                    isRunning: true,
                    isSubthread: false,
                    isNormal: true,
                    isSwapped: false,
                    theme: theme,
                    onSubBtnClick: subThreadToExtension,
                    onSwappedBtnClick: handleSwapBtnClick,
                    onNodeListClick: onNodeListClickHandle,
                    onNodeStateChanged: onNodeStateHandle,
                    onNodeDoubleClick: handleNodeClick,
                    onNodeTitleChange: handleNodeTitleChange
                },
            };
            setNodes((nds) => nds.concat(newNode));
            addHistory();
            setHistoryState(0);
        },
        [addHistory, handleNodeClick, handleNodeTitleChange, handleSwapBtnClick, onNodeListClickHandle, onNodeStateHandle, screenToFlowPosition, setNodes, subThreadToExtension, theme]
    );

    useEffect(() => {
        const importNodeBack = (jsonArr: any) => {
            //clearNode();
            const mainElement = jsonArr.find((element: any) => element.parentID === 'main');
            if (mainElement) {
                const nodes = mainElement.nodes;
                const edges = mainElement.edges;
                const newnodes = nodes.map((node: any) => {
                    return {
                        id: node.id,
                        type: node.type,
                        position: node.position,
                        selected: false,
                        data: {
                            title: node.data.title,
                            content: node.data.content,
                            isRunning: node.data.isRunning,
                            isSubthread: node.data.isSubthread,
                            isNormal: node.data.isNormal,
                            isSwapped: node.data.isSwapped,
                            theme: theme,
                            onSubBtnClick: subThreadToExtension,
                            onNodeListClick: onNodeListClickHandle,
                            onNodeStateChanged: onNodeStateHandle,
                            onSwappedBtnClick: handleSwapBtnClick,
                            onNodeDoubleClick: handleNodeClick,
                            onNodeTitleChange: handleNodeTitleChange
                        }
                    }
                })
                const newedges = edges.map((edge: any) => {
                    return {
                        id: edge.id,
                        source: edge.source,
                        sourceHandle: edge.sourceHandle,
                        target: edge.target,
                        targetHandle: edge.targetHandle
                    }
                })
                setNodes(newnodes);
                setEdges(newedges);
                //setHistoryArr([]);
                addHistory();
            }
        }
        const loadNodeData = (message: any) => {
            clearNode();
            setProjectPath(message.path);
            setProjectDir(message.path.substring(0, message.path.lastIndexOf('\\')));
            parentID = message.threadid;
            console.log(message);
            const mainElement = message.data;
            if (mainElement) {
                const nodes = mainElement.nodes;
                const edges = mainElement.edges;
                const newnodes = nodes.map((node: any) => {
                    return {
                        id: node.id,
                        type: node.type,
                        position: node.position,
                        selected: false,
                        data: {
                            title: node.data.title,
                            content: node.data.content,
                            isRunning: node.data.isRunning,
                            isSubthread: node.data.isSubthread,
                            isNormal: node.data.isNormal,
                            isSwapped: node.data.isSwapped,
                            theme: theme,
                            onSubBtnClick: subThreadToExtension,
                            onNodeListClick: onNodeListClickHandle,
                            onNodeStateChanged: onNodeStateHandle,
                            onSwappedBtnClick: handleSwapBtnClick,
                            onNodeDoubleClick: handleNodeClick,
                            onNodeTitleChange: handleNodeTitleChange
                        }
                    }
                });
                setNodes(newnodes);
                setEdges(edges);
                setHistoryArr([]);
                addHistory();
            }
        }
        const handleMessage = (event: any) => {
            const message = event.data;
            switch (message.type) {
                case 'saveallnodeback':
                    saveNodeToExtension();
                    break;
                case 'importnodeback':
                    importNodeBack(message.data);
                    break;
                case 'openprojectback':
                    loadNodeData(message);
                    break;
                case 'panelactive':
                    setPanelActive(message.data);
                    break;
                case 'setnodeoptions':
                    updateOptions(message.data);
                    break;
                case 'setnodetocenter':
                    centerNode(message.data);
                    break;
                case 'settheme':
                    onVsCodeThemeChange(message.data);
                    break;
            }
        };
        // 监听来自 VSCode 扩展的消息
        window.addEventListener('message', handleMessage);
        // 在组件卸载时移除监听器
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [addHistory, centerNode, clearNode, handleNodeClick, handleNodeTitleChange, handleSwapBtnClick, onNodeListClickHandle, onNodeStateHandle, onVsCodeThemeChange, projectDir, saveNodeToExtension, setEdges, setNodes, setPanelActive, setProjectPath, subThreadToExtension, theme, updateOptions]);

    useEffect(() => {
        if (historyArr.length == 0) {
            const jsonObject = JSON.stringify({ nodes: nodes, edges: edges });
            historyArr.push(jsonObject);
            setHistoryIndex(historyArr.length);
        }
    }, [edges, historyArr, nodes]);
    useEffect(() => {
        async function handleKeyDown(event: { ctrlKey: boolean; shiftKey: boolean; key: string; preventDefault: () => void; }) {
            if (event.ctrlKey && (event.key === 'h' || event.key === 'H')) {
                reactFlowInstance.fitView();
            } else if (event.ctrlKey && (event.key === 'c' || event.key === 'C')) {
                console.log('Ctrl+C');
                encryptAndCopyToClipboard(JSON.stringify({ nodes: selectionNodes, edges: selectionEdges }));
            } else if (event.ctrlKey && (event.key === 'v' || event.key === 'V')) {
                console.log('Ctrl+V');
                const copiedStr = await decryptFromClipboard();
                const copiedObj = JSON.parse(copiedStr);
                const newArr = randomizeNodeIds(copiedObj);
                const newNodes = newArr.nodes.map((node: any) => {
                    return {
                        ...node,
                        position: { x: node.position.x + 150, y: node.position.y + 150 },
                        selected: false,
                        data: {
                            ...node.data,
                            theme: theme,
                            onSubBtnClick: subThreadToExtension,
                            onNodeListClick: onNodeListClickHandle,
                            onNodeStateChanged: onNodeStateHandle,
                            onSwappedBtnClick: handleSwapBtnClick,
                            onNodeDoubleClick: handleNodeClick,
                            onNodeTitleChange: handleNodeTitleChange
                        }
                    }
                });
                const newEdges = newArr.edges;
                setNodes((nodes) => nodes.concat(newNodes));
                setEdges((edges) => edges.concat(newEdges));
            } else if (event.ctrlKey && !event.shiftKey && (event.key === 's' || event.key === 'S')) {
                console.log('Ctrl+S');
                saveNodeToExtension();
            }
            else if (event.ctrlKey && event.shiftKey && (event.key === 's' || event.key === 'S')) {
                console.log('Ctrl+Shift+S');
                saveAllNodeToExtension();
            } else if (event.ctrlKey && (event.key === 'z' || event.key === 'Z')) {
                console.log('Ctrl+Z');
                if (historyIndex > 1) {
                    setHistoryIndex(historyIndex - 1);
                    const jsonObject = JSON.parse(historyArr[historyIndex - 2]);
                    setNodes(jsonObject.nodes);
                    setEdges(jsonObject.edges);
                }
            } else if (event.ctrlKey && (event.key === 'y' || event.key === 'Y')) {
                console.log('Ctrl+Y');
                if (historyIndex < historyArr.length) {
                    setHistoryIndex(historyIndex + 1);
                    const jsonObject = JSON.parse(historyArr[historyIndex]);
                    setNodes(jsonObject.nodes);
                    setEdges(jsonObject.edges);
                }
            } else if (event.ctrlKey) {
                console.log("ctrl");
                if (historyState === 0) {
                    addHistory();
                    setHistoryState(1);
                }
            }
        }
        const timer = setInterval(() => {
        }, 1000); // 每秒执行一次
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            clearInterval(timer);
        };
    }, [addHistory, handleNodeClick, handleNodeTitleChange, handleSwapBtnClick, historyArr, historyIndex, historyState, onNodeListClickHandle, onNodeStateHandle, reactFlowInstance, saveAllNodeToExtension, saveNodeToExtension, selectionEdges, selectionNodes, setEdges, setNodes, subThreadToExtension, theme]);

    const randomizeNodeIds = (data: any): any => {
        const { nodes, edges } = data;
        // 创建一个映射表来存储旧 ID 到新随机 ID 的映射
        const idMap: Record<string, string> = {};
        // 为每个节点生成新的随机 ID，并更新节点 ID
        const updatedNodes = nodes.map((node: Node) => {
            const newId = generateUniqueId();
            idMap[node.id] = newId;
            return { ...node, id: newId };
        });
        // 更新连线的 source 和 target，并过滤无效连线
        const updatedEdges = edges
            .map((edge: Edge) => ({
                ...edge,
                source: idMap[edge.source],
                target: idMap[edge.target],
            }))
            .filter((edge: Edge) => edge.source && edge.target); // 移除没有有效节点的连线
        // 返回更新后的数据对象
        return {
            nodes: updatedNodes,
            edges: updatedEdges,
        };
    };
    //监听选中节点事件
    const onSelectionChange = (event: unknown) => {
        setSelectionNodes((event as any).nodes);
        setSelectionEdges((event as any).edges);
    };

    const edgesAnimated = () => {
        setIsEdgeAnimated(!isEdgeAnimated);
        const updatedEdges = edges.map((edge) => ({
            ...edge,
            animated: isEdgeAnimated,
        }));
        setEdges(updatedEdges);
    };
    const onLayout = useCallback((direction: string) => {
        const {
            nodes: layoutedNodes,
            edges: layoutedEdges
        } = getLayoutedElements(nodes as Node[], edges as Edge[], direction);

        setNodes([...layoutedNodes] as Node[]);
        setEdges([...layoutedEdges] as Edge[]);
        reactFlowInstance.fitView();
    },
        [nodes, edges, setNodes, setEdges, reactFlowInstance]
    );
    return (
        <div style={{ width: '100vw', height: '100vh', padding: 0 }}>
            <ReactFlow
                nodes={nodes}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onNodesDelete={handleNodesDelete}
                onNodeDragStart={handleNodesDragStart}
                onNodeDrag={handleNodesDrag}
                onNodeDragStop={handleNodesDragStop}

                edges={edges}
                edgeTypes={edgeTypes}
                onEdgesChange={onEdgesChange}
                onConnect={handleEdgesConnect}
                onEdgesDelete={handleEdgesDelete}

                onDragOver={onDragOver}
                onDrop={onDrop}
                onSelectionChange={onSelectionChange}
                selectNodesOnDrag={true}
                fitView
                minZoom={0.125}  // 最小缩放倍数
                maxZoom={1.5}
                className={`myflow ${theme}`}
            >
                <Background
                    color="gray" // 网格线的颜色
                    //  gap={30}     // 网格线之间的间距
                    //  size={0.1}   // 网格线的宽度
                    variant={BackgroundVariant.Dots}
                />
                <Controls />
                <div style={{ position: 'relative', zIndex: 1000, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* <button onClick={importNodeToExtension}>导入</button>
                    <button onClick={createNewNodeFile}>新建</button>
                    <button onClick={openProjectToExtension}>打开项目</button>
                    <button onClick={openProjectToExtension}>保存节点数据</button>
                    <button onClick={saveAllNodeToExtension}>保存所有节点数据</button>
                    <button onClick={() => saveCodeToExtension('', '')}>保存所有代码修改</button>
                    <button onClick={edgesAnimated}>边线动画</button>
                    <button onClick={() => onLayout("TB")}>纵向布局</button>
                    <button onClick={() => onLayout("LR")}>横向布局</button>
                        <button onClick={() => logInfo()}>输出LOG</button>*/}
                </div>
                <NodeBar theme={theme} />
            </ReactFlow>
        </div>
    );
};

export default MyFlow;
