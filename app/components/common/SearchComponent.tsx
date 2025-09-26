"use client";

import { useState } from "react";

interface SearchComponentProps {
  filterText: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SearchComponent({ filterText, handleSearch }: SearchComponentProps) {
  return (
    <div className="d-flex align-items-center" style={{ maxWidth: "90px" }}>
      <input
        type="text"
        className="form-control"
        placeholder="🔍 ..."
        value={filterText}
        onChange={handleSearch}
      />
    </div>
  );
}

export function useSearch<T extends Record<string, unknown>>(originalData: T[]) {
  const [filterText, setFilterText] = useState("");
  const [filteredData, setFilteredData] = useState(originalData);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value.trim();
    setFilterText(searchValue);

    if (!searchValue) {
      setFilteredData(originalData);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    const filtered = originalData.filter(item =>
      Object.values(item).some(value => String(value).toLowerCase().includes(searchLower)),
    );

    setFilteredData(filtered);
  };

  return { filterText, filteredData, handleSearch };
}
