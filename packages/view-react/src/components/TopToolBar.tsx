import savenodeIcon from '/savenode.svg';
import savenodeallIcon from '/savenodeall.svg';
import savecodeallIcon from '/savecodeall.svg';
import "./TopToolBar.css";

import { useWebviewPublicPath } from '../hooks/use-webview-public-path';

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const TopToolBar = (_data:any) => {
    const [savenodeIconPath] = useWebviewPublicPath(savenodeIcon)
    const [savenodeallIconPath] = useWebviewPublicPath(savenodeallIcon)
    const [savecodeallIconPath] = useWebviewPublicPath(savecodeallIcon)

    return (
        <div className='toptoolbar' style={{ position: "fixed", top: 100, left: '45%' }}>
            <div className='toolitem-div'>
                <img src={savenodeIconPath} className='toolitem-img'></img>
            </div>
            <div className='toptoolbar-split'></div>
            <div className='toolitem-div'>
                <img src={savenodeallIconPath} className='toolitem-img'></img>
            </div>
            <div className='toptoolbar-split'></div>
            <div className='toolitem-div'>
                <img src={savecodeallIconPath} className='toolitem-img'></img>
            </div>
        </div >

    );
};
export default TopToolBar;