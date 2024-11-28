
import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';
import os = require('os');
// TreeView 数据提供器
export class SimpleTreeDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined> = new vscode.EventEmitter<MyTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined> = this._onDidChangeTreeData.event;

    private rootData: any; // 用于保存根节点的 JSON 数据

    constructor(initialData: any) {
        this.rootData = initialData; // 初始化树的根节点数据
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
            `${jsonData.label}`,
            vscode.TreeItemCollapsibleState.Collapsed,
            jsonData.id
        );
        treeItem.tooltip = `节点ID: ${jsonData.id}`;
        treeItem.command = { // 点击图标时触发的命令
            command: 'extension.handleButtonClick',
            title: 'Handle Button Click',
            arguments: [jsonData.id] // 将节点 ID 传递给命令
        };
        if (jsonData.children && Array.isArray(jsonData.children)) {
            treeItem.children = jsonData.children.map((child: any) => this.convertJsonToTreeItem(child));
        }

        const iconpath = 'C:\\Users\\' + os.userInfo().username + '\\AppData\\Roaming\\Code\\User\\vsicons-custom-icons\\file_type_icon_hr32.svg';
        treeItem.iconPath = {
            light: vscode.Uri.file(iconpath), // 替换为实际图标路径
            dark: vscode.Uri.file(iconpath)  // 替换为实际图标路径
        };
        return treeItem;
    }

    // 更新树的根节点数据
    updateJsonData(newJsonData: any) {
        this.rootData = newJsonData;
        this._onDidChangeTreeData.fire(undefined); // 通知树视图更新
    }
}
class MyTreeItem extends vscode.TreeItem {
    children?: MyTreeItem[];

    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, children?: MyTreeItem[]) {
        super(label, collapsibleState);
        this.children = children;
    }
}