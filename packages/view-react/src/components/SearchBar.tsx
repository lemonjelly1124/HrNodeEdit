// SearchBar.tsx
import React, { useState } from 'react';
import './SearchBar.css';
interface SearchBarProps {
    result: string;
    onSearch: (query: string) => void; // 父组件传入的回调函数
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, result }) => {
    const [inputValue, setInputValue] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleSearch = () => {
        onSearch(inputValue); // 将输入框内容传给父组件
    };

    return (
        <div className="searchContainer">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="请输入节点ID"
                className="searchInput"
            />
            <button onClick={handleSearch} className="searchButton">
                搜索
            </button>
            <label className='searchLabel'>{result }</label>
        </div>
    );
};

export default SearchBar;
