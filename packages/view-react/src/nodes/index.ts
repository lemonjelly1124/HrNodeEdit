// import type { Node, NodeTypes } from "reactflow";
import { StartNode } from "./StartNode";
import { ProcessNode } from "./ProcessNode";
import { OverNode } from "./OverNode";
import { JudgeNode } from "./JudgeNode";
import { SwitchNode } from "./SwitchNode";


// type cNode = Node | ProcessNodeData;

export const initialNodes= [

];

export const nodeTypes = {
    StartNode: StartNode,
    ProcessNode: ProcessNode,
    OverNode: OverNode,
    JudgeNode: JudgeNode,
    SwitchNode: SwitchNode,

}
