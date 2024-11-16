"use client";

import React, { useRef, useEffect, useState } from 'react';
import dynamic from "next/dynamic";
import { Bookmark, FileDown, FilePenLine } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Dynamically import ReactQuill, only on the client side
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false }) as unknown as React.ComponentType<any>;
import "react-quill-new/dist/quill.snow.css";
import jsPDF from 'jspdf';

// NoteArea component to display and edit notes
const NoteArea = () => {
    const selectedNoteContent = { content: '' };
    let copiedText = '';

    // Refs to handle the Quill editor instance
    const quillRef = useRef<typeof ReactQuill | null>(null);

    // State to manage the content, modal visibility, and note title
    const [content, setContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');

    // Define modules for ReactQuill toolbar
    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ color: [] }, { background: [] }],
            ["link", "blockquote", "code-block"],
            ["clean"],
        ],
    };

    // Define formats for ReactQuill toolbar
    const formats = [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "list",
        "bullet",
        "color",
        "background",
        "link",
        "blockquote",
        "code-block",
    ];

    // Effect to set the content if a selected note is passed
    useEffect(() => {
        if (selectedNoteContent) {
            setContent(selectedNoteContent.content);
        }
    }, [selectedNoteContent]);

    // Effect to append copied text to the note content
    useEffect(() => {
        if (copiedText && quillRef.current) {
            const quill = quillRef.current.getEditor();
            let currentContent = quill.root.innerHTML;
            if (currentContent === '<p><br></p>') currentContent = "";
            const newContent = currentContent.length > 0 ? currentContent + '<br>' + copiedText : copiedText;
            setContent(newContent);
        }
    }, [copiedText]);

    // Handler for content changes in the Quill editor
    const handleChange = (value: string) => {
        setContent(value);
    };

    // Function to download the note content as a PDF
    const downloadAsPdf = () => {
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            const delta = quill.getContents();
            const doc = new jsPDF();
            doc.setFontSize(12);
            const pageHeight = doc.internal.pageSize.getHeight();
            let y = 20;

            // Iterate through delta ops and add them to the PDF
            delta.ops.forEach((op) => {
                if (op.insert) {
                    if (typeof op.insert === 'string') {
                        const lines = doc.splitTextToSize(op.insert, doc.internal.pageSize.getWidth() - 40);
                        lines.forEach((line) => {
                            if (y + 12 > pageHeight) {
                                y = 20;
                                doc.addPage();
                            }
                            doc.text(line, 20, y);
                            y += 12;
                        });
                    }
                }
            });

            // Save the generated PDF
            doc.save('note-content.pdf');
        }
    };

    // Function to save the note to local storage
    const saveToLocalStorage = () => {
        const existingNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
        const noteIndex = existingNotes.findIndex(note => note.title === noteTitle);

        if (noteIndex > -1) {
            existingNotes[noteIndex].content = content;
        } else {
            existingNotes.push({ title: noteTitle, content });
        }

        localStorage.setItem('savedNotes', JSON.stringify(existingNotes));
        setIsModalOpen(false);
        setNoteTitle('');
    };

    copiedText = 'Hello world';

    return (
        <div className="w-1/2">
            <Card className="h-full flex flex-col bg-muted/50 md:min-h-min">
                <CardContent className="flex-1 p-4">
                    {copiedText?.length > 0 || selectedNoteContent?.content?.length > 0 ? (
                        <div className='flex flex-col gap-4 h-[calc(100vh-120px)]'>
                            <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                                <input
                                    type="text"
                                    placeholder="Untitled Document"
                                    className="text-2xl font-bold bg-transparent outline-none text-white flex-1"
                                />
                                <div className="flex space-x-4 text-gray-400">
                                    <button title="Edit" className="hover:text-white transition">
                                        <FilePenLine className="w-6 h-6" />
                                    </button>
                                    <button title="Bookmark" className="hover:text-white transition">
                                        <Bookmark className="w-6 h-6" />
                                    </button>
                                    <button title="Download" className="hover:text-white transition">
                                        <FileDown className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="h-[calc(100vh-180px)] flex-1">
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    modules={modules}
                                    formats={formats}
                                    onChange={handleChange}
                                    value={content}
                                    className="h-[95%]"
                                    placeholder="Start writing here..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center p-8 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/50">
                                <p className="text-muted-foreground">
                                    Notes will appear here once you start adding content.
                                    <br />
                                    Select text and click send to notes, or start a new note.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Input
                            placeholder="Note Title"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={saveToLocalStorage}>
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NoteArea;