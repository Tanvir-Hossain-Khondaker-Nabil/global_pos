import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Bounce, toast, ToastContainer } from "react-toastify";
import { usePage } from "@inertiajs/react";

export default function Layout({ children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const { flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [noteOpen, setNoteOpen] = useState(false);
    const [noteContent, setNoteContent] = useState("");

    // Function to check if user has permission
    const hasPermission = (permission) => {
        if (!user?.permissions) return true;
        return user.permissions.includes(permission);
    };

    // Load note from localStorage on component mount
    useEffect(() => {
        const savedNote = localStorage.getItem('floating_note');
        if (savedNote) {
            setNoteContent(savedNote);
        }
    }, []);

    // Save note to localStorage whenever it changes
    useEffect(() => {
        if (noteContent !== null) {
            localStorage.setItem('floating_note', noteContent);
        }
    }, [noteContent]);

    // make flash message
    useEffect(() => {
        if (flash.error) {
            toast.error(flash.error);
        }
        if (flash.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    return (
        <div className="min-h-screen bg-[#F8FAF5] font-sans overflow-x-hidden" style={{ fontFamily: "'Public Sans', sans-serif" }}>
            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div 
                    id="overlay"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                ></div>
            )}

            {/* Notepad Modal */}
            {noteOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="overflow-auto bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Notepad</h3>
                            <button 
                                onClick={() => setNoteOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 p-4">
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                className="w-full h-full min-h-[300px] p-3 border rounded-lg resize-none focus:outline-none"
                                placeholder="Type your notes here..."
                                autoFocus
                            />
                        </div>
                        <div className="p-4 border-t flex justify-between">
                            <button 
                                onClick={() => {
                                    setNoteContent("");
                                    toast.success("Note cleared!");
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Clear
                            </button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setNoteOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                                <button 
                                    onClick={() => {
                                        setNoteOpen(false);
                                        toast.success("Note saved!");
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                                >
                                    Save & Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Sidebar status={sidebarOpen} setStatus={setSidebarOpen} />
            
            {/* MAIN CONTENT AREA */}
            <main className={`lg:ml-72 flex-1 min-h-screen transition-all flex flex-col ${sidebarOpen ? 'ml-0' : ''}`}>
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="p-4 lg:p-8 space-y-8 flex-1">{children}</div>
            </main>

            {/* FLOATING NOTEPAD BUTTON */}
            <button 
                onClick={() => setNoteOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all cursor-pointer z-40" 
                style={{background: 'linear-gradient(180deg, #1e4d2b 0%, #35a952 100%)'}}
                title="Open Notepad"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-notebook-pen">
                    <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/>
                    <path d="M2 6h4"/>
                    <path d="M2 10h4"/>
                    <path d="M2 14h4"/>
                    <path d="M2 18h4"/>
                    <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
                </svg>
            </button>

            <ToastContainer
                position="bottom-right"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                transition={Bounce}
            />
        </div>
    );
}