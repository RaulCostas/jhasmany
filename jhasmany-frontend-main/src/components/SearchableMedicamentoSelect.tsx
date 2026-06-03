import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Medicamento } from '../types';

interface SearchableMedicamentoSelectProps {
    medicamentosCatalog: Medicamento[];
    selectedId?: number;
    onSelect: (id: number) => void;
    required?: boolean;
    placeholder?: string;
    className?: string;
}

const SearchableMedicamentoSelect: React.FC<SearchableMedicamentoSelectProps> = ({
    medicamentosCatalog,
    selectedId,
    onSelect,
    required = false,
    placeholder = "-- Seleccione Medicamento --",
    className = ""
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter catalog based on search term
    const filteredMedicamentos = medicamentosCatalog.filter(m => {
        if (m.estado !== 'activo' && m.id !== selectedId) return false;
        return m.medicamento.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Update label when selectedId or catalog changes
    useEffect(() => {
        if (selectedId) {
            const med = medicamentosCatalog.find(m => m.id === selectedId);
            if (med) {
                setSelectedLabel(med.medicamento);
            } else {
                setSelectedLabel('');
            }
        } else {
            setSelectedLabel('');
            setSearchTerm('');
        }
    }, [selectedId, medicamentosCatalog]);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                // Check if the click was inside the portal container to avoid premature closure
                if (listRef.current && listRef.current.contains(event.target as Node)) {
                    return;
                }
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Calculate position for fixed dropdown relative to the viewport
    const updateCoords = () => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 4, // 4px below the input
                left: rect.left,
                width: rect.width
            });
        }
    };

    // Track scroll and resize when dropdown is open
    useEffect(() => {
        if (isOpen) {
            updateCoords();
            // useCapture = true to intercept scrolls in any scrollable parent
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    // Handle selection
    const handleSelect = (med: Medicamento) => {
        setSelectedLabel(med.medicamento);
        onSelect(med.id);
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                setHighlightedIndex(prev => 
                    prev < filteredMedicamentos.length - 1 ? prev + 1 : prev
                );
                e.preventDefault();
                break;
            case 'ArrowUp':
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
                e.preventDefault();
                break;
            case 'Enter':
                if (highlightedIndex >= 0 && highlightedIndex < filteredMedicamentos.length) {
                    handleSelect(filteredMedicamentos[highlightedIndex]);
                } else if (filteredMedicamentos.length > 0) {
                    handleSelect(filteredMedicamentos[0]);
                }
                e.preventDefault();
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
                inputRef.current?.blur();
                e.preventDefault();
                break;
            case 'Tab':
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
                break;
            default:
                break;
        }
    };

    // Scroll highlighted item into view if necessary
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const container = listRef.current;
            const item = container.children[highlightedIndex] as HTMLElement;
            if (item) {
                const containerTop = container.scrollTop;
                const containerBottom = containerTop + container.clientHeight;
                const itemTop = item.offsetTop;
                const itemBottom = itemTop + item.clientHeight;

                if (itemTop < containerTop) {
                    container.scrollTop = itemTop;
                } else if (itemBottom > containerBottom) {
                    container.scrollTop = itemBottom - container.clientHeight;
                }
            }
        }
    }, [highlightedIndex]);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={isOpen ? searchTerm : selectedLabel}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setHighlightedIndex(0);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearchTerm('');
                        setHighlightedIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedLabel || placeholder}
                    required={required && !selectedId}
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                {!!selectedId && !isOpen && (
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(0);
                            setSelectedLabel('');
                        }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 bg-transparent hover:bg-transparent border-none p-0 min-h-0 min-w-0 shadow-none focus:outline-none focus:ring-0"
                        title="Limpiar selección"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
            </div>

            {isOpen && createPortal(
                <div 
                    ref={listRef}
                    style={{
                        position: 'fixed',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                    }}
                    className="z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto"
                >
                    {filteredMedicamentos.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                            No se encontraron medicamentos
                        </div>
                    ) : (
                        filteredMedicamentos.slice(0, 100).map((med, index) => (
                            <div
                                key={med.id}
                                onClick={() => handleSelect(med)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={`p-2.5 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0 text-sm transition-colors ${
                                    index === highlightedIndex 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' 
                                        : 'text-gray-800 dark:text-gray-200'
                                }`}
                            >
                                {med.medicamento}
                            </div>
                        ))
                    )}
                    {filteredMedicamentos.length > 100 && (
                        <div className="p-2 text-[10px] text-gray-400 text-center bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 sticky bottom-0">
                            Mostrando los primeros 100 resultados. Refine su búsqueda.
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default SearchableMedicamentoSelect;
