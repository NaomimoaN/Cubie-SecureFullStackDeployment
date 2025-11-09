import React, { useState, useRef, useEffect } from 'react';

const ExpandableSearch = ({ 
  onSearch, 
  onToggle, 
  isExpanded = false,
  placeholder = "Search groups...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [isExpanded]);

  const handleToggle = () => {
    if (isExpanded) {
      setSearchTerm("");
      onSearch?.("");
    }
    setIsAnimating(true);
    onToggle?.();
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch?.("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center">
        {!isExpanded && (
          <button 
            onClick={handleToggle}
            className="relative z-10 p-2 rounded-full transition-all duration-300 ease-in-out text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-transparent hover:bg-transparent"
            aria-label="Open search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </button>
        )}

        <div 
          ref={searchContainerRef}
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded 
              ? 'w-48 opacity-100' 
              : 'w-0 opacity-0'
          }`}
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={handleSearchChange}
              className={`w-full py-2 pl-8 pr-10 text-sm bg-white border border-gray-300 rounded-lg 
                focus:outline-none
                transition-all duration-200`}
            />
            
            <button
              onClick={handleToggle}
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200 p-0 bg-transparent hover:bg-transparent border-0"
              aria-label="Close search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>

            {searchTerm && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200 bg-transparent hover:bg-transparent"
                aria-label="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                </button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && searchTerm && (
        <div 
          className={`absolute top-full left-0 right-0 mt-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-600 z-20
            transition-all duration-200 ${
              searchTerm ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
            }`}
        >
          Searching for "{searchTerm}"...
        </div>
      )}
    </div>
  );
};

export default ExpandableSearch;