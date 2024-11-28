import React, { useState } from 'react';
import './Combox.css';

interface Option {
    id: number; // 每个选项的唯一标识
    title: string; // 选项的显示文本
}

interface ComboxProps {
    options: Option[]; // 接收选项数组
    onItemSelected: (id: number, title: string) => void; // 回调函数，传递选中的 id 和字符串
}

const Combox: React.FC<ComboxProps> = ({ options, onItemSelected }) => {
    const [isOpen, setIsOpen] = useState(false); // 控制下拉框的状态

    const handleMouseEnter = () => {
        setIsOpen(true); // 鼠标悬浮时打开下拉框
    };

    const handleMouseLeave = () => {
        setIsOpen(false); // 鼠标移出时关闭下拉框
    };

    const handleSelectItem = (item: Option) => {
        setIsOpen(false); // 关闭下拉框
        onItemSelected(item.id, item.title); // 通知父组件
    };

    return (
        <div
            className="combox-container"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="combox-selected">
                <span>节点</span>
                <span>{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
                <ul className="combox-dropdown">
                    {options.map((option) => (
                        <li
                            key={option.id}
                            className="combox-item"
                            onClick={() => handleSelectItem(option)}
                        >
                            {option.title}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Combox;
