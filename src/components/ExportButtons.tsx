"use client";

import { useState } from 'react';
import { FileDown, FileText, FileType, Loader2, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface ExportButtonsProps {
    markdown: string;
    filename?: string;
}

export default function ExportButtons({ markdown, filename = "summary" }: ExportButtonsProps) {
    const [exporting, setExporting] = useState<string | null>(null);
    const [exported, setExported] = useState<string | null>(null);

    if (!markdown) return null;

    // Convert markdown to plain text
    const markdownToPlainText = (md: string): string => {
        return md
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
            .replace(/\*([^*]+)\*/g, '$1') // Italic
            .replace(/`([^`]+)`/g, '$1') // Code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
            .replace(/<br>/g, '\n') // BR tags
            .replace(/---/g, '') // Horizontal rules
            .replace(/\* \[ \]/g, '[ ]') // Checkboxes
            .replace(/\* /g, '- ') // Bullets
            .trim();
    };

    // Parse markdown to structured content
    const parseMarkdown = (md: string) => {
        const lines = md.split('\n');
        const content: Array<{ type: 'heading' | 'paragraph' | 'bullet'; level?: number; text: string }> = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === '---' || trimmed === '<br>') continue;

            // Headings
            const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
            if (headingMatch) {
                content.push({
                    type: 'heading',
                    level: headingMatch[1].length,
                    text: headingMatch[2].replace(/\*\*/g, '').replace(/`/g, ''),
                });
                continue;
            }

            // Bullets
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                content.push({
                    type: 'bullet',
                    text: trimmed.substring(2).replace(/\*\*/g, '').replace(/`/g, ''),
                });
                continue;
            }

            // Regular text
            if (trimmed.length > 0) {
                content.push({
                    type: 'paragraph',
                    text: trimmed.replace(/\*\*/g, '').replace(/`/g, ''),
                });
            }
        }

        return content;
    };

    // Export to PDF
    const exportToPDF = async () => {
        setExporting('pdf');
        try {
            const doc = new jsPDF();
            const content = parseMarkdown(markdown);
            let y = 20;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            const lineHeight = 7;

            // Add Japanese font support would require additional setup
            // For now, we'll use basic text

            for (const item of content) {
                // Check if we need a new page
                if (y > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }

                if (item.type === 'heading') {
                    const fontSize = item.level === 1 ? 18 : item.level === 2 ? 14 : 12;
                    doc.setFontSize(fontSize);
                    doc.setFont('helvetica', 'bold');

                    const lines = doc.splitTextToSize(item.text, 170);
                    doc.text(lines, margin, y);
                    y += lines.length * lineHeight + 5;
                } else if (item.type === 'bullet') {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const bulletText = `  - ${item.text}`;
                    const lines = doc.splitTextToSize(bulletText, 165);
                    doc.text(lines, margin, y);
                    y += lines.length * lineHeight;
                } else {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const lines = doc.splitTextToSize(item.text, 170);
                    doc.text(lines, margin, y);
                    y += lines.length * lineHeight + 2;
                }
            }

            doc.save(`${filename}.pdf`);
            setExported('pdf');
            setTimeout(() => setExported(null), 2000);
        } catch (error) {
            console.error('PDF export error:', error);
            alert('PDF出力に失敗しました');
        } finally {
            setExporting(null);
        }
    };

    // Export to Word (docx)
    const exportToWord = async () => {
        setExporting('word');
        try {
            const content = parseMarkdown(markdown);
            const children: Paragraph[] = [];

            for (const item of content) {
                if (item.type === 'heading') {
                    const level = item.level === 1 ? HeadingLevel.HEADING_1 :
                        item.level === 2 ? HeadingLevel.HEADING_2 :
                            HeadingLevel.HEADING_3;

                    children.push(
                        new Paragraph({
                            text: item.text,
                            heading: level,
                            spacing: { after: 200 },
                        })
                    );
                } else if (item.type === 'bullet') {
                    children.push(
                        new Paragraph({
                            children: [new TextRun(item.text)],
                            bullet: { level: 0 },
                        })
                    );
                } else {
                    children.push(
                        new Paragraph({
                            children: [new TextRun(item.text)],
                            spacing: { after: 120 },
                        })
                    );
                }
            }

            const doc = new Document({
                sections: [{
                    properties: {},
                    children,
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${filename}.docx`);

            setExported('word');
            setTimeout(() => setExported(null), 2000);
        } catch (error) {
            console.error('Word export error:', error);
            alert('Word出力に失敗しました');
        } finally {
            setExporting(null);
        }
    };

    // Export to Markdown file
    const exportToMarkdown = () => {
        setExporting('md');
        try {
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            saveAs(blob, `${filename}.md`);

            setExported('md');
            setTimeout(() => setExported(null), 2000);
        } catch (error) {
            console.error('Markdown export error:', error);
            alert('Markdown出力に失敗しました');
        } finally {
            setExporting(null);
        }
    };

    // Copy Notion-formatted text
    const copyForNotion = async () => {
        setExporting('notion');
        try {
            // Notion accepts markdown, so we can copy directly
            await navigator.clipboard.writeText(markdown);

            setExported('notion');
            setTimeout(() => setExported(null), 2000);
        } catch (error) {
            console.error('Notion copy error:', error);
            alert('Notionコピーに失敗しました');
        } finally {
            setExporting(null);
        }
    };

    const buttonClass = (type: string) =>
        `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${exporting === type
            ? 'bg-gray-100 text-gray-400 cursor-wait'
            : exported === type
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }`;

    return (
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border-t border-gray-100">
            <span className="text-xs text-gray-500 w-full mb-2">エクスポート:</span>

            <button onClick={exportToPDF} disabled={!!exporting} className={buttonClass('pdf')}>
                {exporting === 'pdf' ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : exported === 'pdf' ? (
                    <Check size={16} />
                ) : (
                    <FileDown size={16} />
                )}
                PDF
            </button>

            <button onClick={exportToWord} disabled={!!exporting} className={buttonClass('word')}>
                {exporting === 'word' ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : exported === 'word' ? (
                    <Check size={16} />
                ) : (
                    <FileType size={16} />
                )}
                Word
            </button>

            <button onClick={exportToMarkdown} disabled={!!exporting} className={buttonClass('md')}>
                {exporting === 'md' ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : exported === 'md' ? (
                    <Check size={16} />
                ) : (
                    <FileText size={16} />
                )}
                Markdown
            </button>

            <button onClick={copyForNotion} disabled={!!exporting} className={buttonClass('notion')}>
                {exporting === 'notion' ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : exported === 'notion' ? (
                    <Check size={16} />
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.934-.56.934-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.047-.748.327-.748.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
                    </svg>
                )}
                Notion用コピー
            </button>
        </div>
    );
}
