'use client';

import { useEffect, useState } from 'react';
import { Trash2, Mail, Eye, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Msg { _id: string; name: string; email: string; phone: string; subject: string; message: string; isRead: boolean; createdAt: string; }

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState<Msg[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        const res = await fetch('/api/messages');
        const data = await res.json();
        setMessages(data.messages || []);
        setLoading(false);
    };

    useEffect(() => { fetchMessages(); }, []);

    const markRead = async (id: string) => {
        await fetch(`/api/messages/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true }) });
        fetchMessages();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete?')) return;
        await fetch(`/api/messages/${id}`, { method: 'DELETE' });
        toast.success('Deleted');
        fetchMessages();
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Messages</h1>
            <div className="space-y-3">
                {loading ? <p className="text-gray-400">Loading...</p> :
                    messages.length === 0 ? <p className="text-gray-400 bg-white rounded-lg p-8 text-center shadow-sm">No messages</p> :
                        messages.map(m => (
                            <div key={m._id} className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${m.isRead ? 'border-gray-200' : 'border-[#2874F0]'}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800">{m.name}{m.subject ? ` — ${m.subject}` : ''}</p>
                                        <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                                            {m.email && <span>{m.email}</span>}
                                            {m.phone && <span>{m.phone}</span>}
                                            <span>{new Date(m.createdAt).toLocaleDateString('en-IN')}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">{m.message}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {!m.isRead && <button onClick={() => markRead(m._id)} className="p-1.5 text-gray-400 hover:text-[#2874F0]" title="Mark Read"><Eye size={15} /></button>}
                                        <button onClick={() => handleDelete(m._id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={15} /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                }
            </div>
        </div>
    );
}
