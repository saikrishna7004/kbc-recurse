"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuestionsPage() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState({
        text: "",
        options: ["", "", "", ""],
        correctOption: 0,
        level: 1,
        used: false
    });
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [filterLevel, setFilterLevel] = useState("");
    const [filterUsed, setFilterUsed] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchQuestions();
    }, [filterLevel, filterUsed]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            let url = '/api/questions';
            const params = new URLSearchParams();
            
            if (filterLevel) params.append('level', filterLevel);
            if (filterUsed) params.append('unused', filterUsed === 'unused' ? 'true' : 'false');
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.success) {
                setQuestions(data.data);
            }
        } catch (error) {
            console.error("Error fetching questions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewQuestion((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...newQuestion.options];
        updatedOptions[index] = value;
        setNewQuestion((prev) => ({
            ...prev,
            options: updatedOptions
        }));
    };

    const resetForm = () => {
        setNewQuestion({
            text: "",
            options: ["", "", "", ""],
            correctOption: 0,
            level: 1,
            used: false
        });
        setEditMode(false);
        setCurrentId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editMode && currentId) {
                const res = await fetch(`/api/questions/${currentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newQuestion)
                });
                
                const data = await res.json();
                
                if (data.success) {
                    fetchQuestions();
                    resetForm();
                }
            } else {
                const res = await fetch('/api/questions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newQuestion)
                });
                
                const data = await res.json();
                
                if (data.success) {
                    fetchQuestions();
                    resetForm();
                }
            }
        } catch (error) {
            console.error("Error saving question:", error);
        }
    };

    const handleEdit = (question) => {
        setNewQuestion({
            text: question.text,
            options: question.options,
            correctOption: question.correctOption,
            level: question.level,
            used: question.used
        });
        setEditMode(true);
        setCurrentId(question._id);
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this question?")) {
            try {
                const res = await fetch(`/api/questions/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await res.json();
                
                if (data.success) {
                    fetchQuestions();
                }
            } catch (error) {
                console.error("Error deleting question:", error);
            }
        }
    };

    const handleToggleUsed = async (question) => {
        try {
            const res = await fetch(`/api/questions/${question._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...question,
                    used: !question.used
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                fetchQuestions();
            }
        } catch (error) {
            console.error("Error updating question:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-yellow-500">KBC Questions Manager</h1>
                    <button 
                        onClick={() => router.push('/admin')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                    >
                        Back to Admin
                    </button>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit Question' : 'Add New Question'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block mb-2">Question Text:</label>
                            <textarea
                                name="text"
                                value={newQuestion.text}
                                onChange={handleInputChange}
                                className="w-full p-2 bg-gray-700 rounded"
                                rows="3"
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {newQuestion.options.map((option, index) => (
                                <div key={index} className="mb-2">
                                    <label className="block mb-1">
                                        Option {index + 1}
                                        {index === parseInt(newQuestion.correctOption) && 
                                            <span className="text-green-500 ml-2">(Correct)</span>
                                        }:
                                    </label>
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="w-full p-2 bg-gray-700 rounded"
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block mb-2">Correct Option:</label>
                                <select
                                    name="correctOption"
                                    value={newQuestion.correctOption}
                                    onChange={handleInputChange}
                                    className="w-full p-2 bg-gray-700 rounded"
                                >
                                    {[0, 1, 2, 3].map(num => (
                                        <option key={num} value={num}>Option {num + 1}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block mb-2">Level:</label>
                                <select
                                    name="level"
                                    value={newQuestion.level}
                                    onChange={handleInputChange}
                                    className="w-full p-2 bg-gray-700 rounded"
                                >
                                    {[1, 2, 3, 4].map(num => (
                                        <option key={num} value={num}>Level {num}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block mb-2">Used:</label>
                                <select
                                    name="used"
                                    value={newQuestion.used}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'used',
                                            value: e.target.value === 'true'
                                        }
                                    })}
                                    className="w-full p-2 bg-gray-700 rounded"
                                >
                                    <option value={false}>No</option>
                                    <option value={true}>Yes</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                            >
                                {editMode ? 'Update Question' : 'Add Question'}
                            </button>
                            
                            {editMode && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Filter Questions</h2>
                    <div className="flex gap-4 flex-wrap">
                        <div>
                            <label className="block mb-2">By Level:</label>
                            <select
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                className="p-2 bg-gray-700 rounded"
                            >
                                <option value="">All Levels</option>
                                {[1, 2, 3, 4].map(num => (
                                    <option key={num} value={num}>Level {num}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block mb-2">By Status:</label>
                            <select
                                value={filterUsed}
                                onChange={(e) => setFilterUsed(e.target.value)}
                                className="p-2 bg-gray-700 rounded"
                            >
                                <option value="">All</option>
                                <option value="unused">Unused Only</option>
                                <option value="used">Used Only</option>
                            </select>
                        </div>
                        
                        <div className="self-end">
                            <button
                                onClick={() => {
                                    setFilterLevel("");
                                    setFilterUsed("");
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h2 className="text-xl font-semibold mb-4">Question List</h2>
                    
                    {loading ? (
                        <p>Loading questions...</p>
                    ) : questions.length === 0 ? (
                        <p>No questions found.</p>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((question) => (
                                <div
                                    key={question._id}
                                    className={`p-4 rounded-lg shadow ${
                                        question.used ? 'bg-gray-800 border-l-4 border-gray-500' : 'bg-gray-700 border-l-4 border-green-500'
                                    }`}
                                >
                                    <div className="flex justify-between mb-2">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            question.level === 1 ? 'bg-green-700' :
                                            question.level === 2 ? 'bg-blue-700' :
                                            question.level === 3 ? 'bg-yellow-700' : 'bg-red-700'
                                        }`}>
                                            Level {question.level}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            question.used ? 'bg-red-700' : 'bg-green-700'
                                        }`}>
                                            {question.used ? 'Used' : 'Unused'}
                                        </span>
                                    </div>
                                    
                                    <p className="text-lg font-semibold mb-3" dangerouslySetInnerHTML={{ __html: question.text }}></p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                        {question.options.map((option, index) => (
                                            <div 
                                                key={index} 
                                                className={`p-2 border rounded ${
                                                    index === question.correctOption ? 'border-green-500 bg-green-900/30' : 'border-gray-600'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: option }}
                                            ></div>
                                        ))}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(question)}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(question._id)}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => handleToggleUsed(question)}
                                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                                        >
                                            Mark as {question.used ? 'Unused' : 'Used'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
