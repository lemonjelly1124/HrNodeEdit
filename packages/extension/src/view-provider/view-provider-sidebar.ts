import { ExtensionContext, WebviewView, } from 'vscode'
import { AbstractViewProvider, ControllerOptions } from './view-provider-abstract'
import * as vscode from 'vscode'
export class ViewProviderSidebar extends AbstractViewProvider {
    constructor(context: ExtensionContext, controller: ControllerOptions) {
        super(context, controller, {
            distDir: 'out/view-reactside1',
            indexPath: 'out/view-reactside1/index.html'
        });


    }

    async resolveWebviewView(webviewView: WebviewView) {
        const { webview } = webviewView;
        webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };
        webview.html = await this.getWebviewHtml(webview);

        webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'searchnode':
                    vscode.commands.executeCommand('reactside1.searchnode', message.data);
                    break;
                case 'importnode':
                    vscode.commands.executeCommand('reactside1.importnode');
                    break;
                default:
                    break;
            }
        });
    }


}
