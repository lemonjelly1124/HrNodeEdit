import './SubButton.css'; // 确保路径正确

// 定义组件的属性类型
interface SubButtonProps {
    x: number;
    y: number;
    text: string;
    imgPath?: string;
    theme?: string;
    onButtonClick: () => void;
}

const SubButton: React.FC<SubButtonProps> = (props) => {
    const { x, y, text,theme, onButtonClick, imgPath } = props;
    return (
        <div className={`subbutton ${theme}`} style={{ position: "fixed", top: x, left: y, }} onClick={onButtonClick}>
            <img src={imgPath} className="subbutton-img"/>
            <div className={`subbutton-text ${theme}`}>{text}</div>
        </div>
    );
};
export default SubButton;
