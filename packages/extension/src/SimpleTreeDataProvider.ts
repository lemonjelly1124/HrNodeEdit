
import * as vscode from 'vscode';
// import { ExtensionContext } from 'vscode';
import os = require('os');
// TreeView 数据提供器

interface TreeNode {
    id: string;
    label: string;
    type: string;
    children?: TreeNode[];
}

export class SimpleTreeDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined> = new vscode.EventEmitter<MyTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined> = this._onDidChangeTreeData.event;
    private context: vscode.ExtensionContext;
    private rootData: any; // 用于保存根节点的 JSON 数据
    private treeJson: any;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.rootData = {};
    }

    getTreeItem(element: MyTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MyTreeItem): MyTreeItem[] {
        if (!element) {
            return [this.convertJsonToTreeItem(this.rootData)];
        }
        return element.children || [];
    }

    convertJsonToTreeItem(jsonData: any): MyTreeItem {
        const treeItem = new MyTreeItem(
            `${jsonData.label}__${jsonData.id}`, // 节点的文本
            vscode.TreeItemCollapsibleState.None, // 默认为不可展开,
            jsonData.id
        );
        if (jsonData.children && Array.isArray(jsonData.children)) {
            treeItem.setCollapsibleState(vscode.TreeItemCollapsibleState.Collapsed); // 可展开
        }

        treeItem.tooltip = `节点ID: ${jsonData.id}`;
        treeItem.command = { // 点击图标时触发的命令
            command: 'extension.handleButtonClick',
            title: 'Handle Button Click',
            arguments: [jsonData.id] // 将节点 ID 传递给命令
        };
        if (jsonData.children && Array.isArray(jsonData.children)) {
            treeItem.children = jsonData.children.map((child: any) => this.convertJsonToTreeItem(child));
        }
        let iconpath;
        switch (jsonData.type) { 
            case 'StartNode':
                iconpath = vscode.Uri.joinPath(this.context.extensionUri, 'image', 'start.svg').fsPath;
                break;
            case 'OverNode':
                iconpath = vscode.Uri.joinPath(this.context.extensionUri, 'image', 'stop.svg').fsPath;
                break;
            case 'SwitchNode':
                iconpath = vscode.Uri.joinPath(this.context.extensionUri, 'image', 'switch.svg').fsPath;
                break;
            case 'ProcessNode':
                iconpath = vscode.Uri.joinPath(this.context.extensionUri, 'image', 'process.svg').fsPath;
                break;
            case 'JudgeNode':
                iconpath = vscode.Uri.joinPath(this.context.extensionUri, 'image', 'judge.svg').fsPath;
                break;
            default:
                iconpath = 'C:\\Users\\' + os.userInfo().username + '\\AppData\\Roaming\\Code\\User\\vsicons-custom-icons\\file_type_icon_hr32.svg';
        }
        treeItem.iconPath = {
            light: vscode.Uri.file(iconpath), // 替换为实际图标路径
            dark: vscode.Uri.file(iconpath)  // 替换为实际图标路径
        };
        return treeItem;
    }

    // 更新树的根节点数据
    updateJsonData(newJsonData: any, _fliterStr?: string) {
        const treejson = this.covertNodeJsonToTreeJson(newJsonData, "main");
        let mainThreadObj: any = { id: "main", label: "主线程", children: treejson };
        if (_fliterStr !== "" && _fliterStr) {
            mainThreadObj = this.removeNodes(mainThreadObj, _fliterStr);
        }
        this.rootData = mainThreadObj;
        this._onDidChangeTreeData.fire(undefined); // 通知树视图更新
    }

    covertNodeJsonToTreeJson(projectData: any, parentid: string): any {
        let treeObj: any = [];
        let threadObj: any;
        for (const thread of projectData) {
            if (thread.parentID === parentid) {
                threadObj = thread;
                break;
            }
        }
        for (const node of threadObj.nodes) {
            let temp: any = {};
            temp.id = node.id;
            temp.label = node.data.title;
            temp.type= node.type;
            if (node.data.isSubthread) {
                temp.children = this.covertNodeJsonToTreeJson(projectData, node.id);
            }
            treeObj.push(temp);
        }
        return treeObj;
    }

    //找到节点title或id等于搜索关键字的节点，删除其子节点
    removeNodes(jsonObject: TreeNode, key: string): TreeNode | null {
        if (jsonObject.children) {
            jsonObject.children = jsonObject.children
                .map(child => this.removeNodes(child, key))
                .filter(child => child !== null) as TreeNode[];
        }
        if ((!jsonObject.label.includes(key) && !jsonObject.id.includes(key)) && (!jsonObject.children || jsonObject.children.length === 0)) {
            return null;
        }
        return jsonObject;
    }
}
class MyTreeItem extends vscode.TreeItem {
    children?: MyTreeItem[];
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, children?: MyTreeItem[]) {
        super(label, collapsibleState);
        this.children = children;
    }
    setCollapsibleState(state: vscode.TreeItemCollapsibleState) {
        this.collapsibleState = state;
    }

}