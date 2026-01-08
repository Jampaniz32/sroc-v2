import React, { useState, useEffect } from 'react';
import { observationTemplatesAPI } from '../services/api';
import { CALL_STAGES, CALL_TYPES } from '../constants';

interface ObservationTemplate {
    id: string;
    tipo_solicitacao: string;
    estado_pedido: string;
    titulo: string;
    observacao: string;
    prioridade: number;
    ativo: boolean;
}

interface ObservationTemplatesManagerProps {
    onClose?: () => void;
}

const ObservationTemplatesManager: React.FC<ObservationTemplatesManagerProps> = ({ onClose }) => {
    const [templates, setTemplates] = useState<ObservationTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<ObservationTemplate | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterEstado, setFilterEstado] = useState('');

    const [formData, setFormData] = useState({
        tipoSolicitacao: '',
        estadoPedido: '',
        titulo: '',
        observacao: '',
        prioridade: 1,
        ativo: true
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            const data = await observationTemplatesAPI.getAll();
            setTemplates(data);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                await observationTemplatesAPI.update(editingTemplate.id, formData);
            } else {
                await observationTemplatesAPI.create(formData);
            }
            loadTemplates();
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar template:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja remover este template?')) {
            try {
                await observationTemplatesAPI.delete(id);
                loadTemplates();
            } catch (error) {
                console.error('Erro ao remover template:', error);
            }
        }
    };

    const handleEdit = (template: ObservationTemplate) => {
        setEditingTemplate(template);
        setFormData({
            tipoSolicitacao: template.tipo_solicitacao,
            estadoPedido: template.estado_pedido,
            titulo: template.titulo,
            observacao: template.observacao,
            prioridade: template.prioridade,
            ativo: template.ativo
        });
        setIsCreating(true);
    };

    const handleToggleActive = async (template: ObservationTemplate) => {
        try {
            await observationTemplatesAPI.update(template.id, {
                tipoSolicitacao: template.tipo_solicitacao,
                estadoPedido: template.estado_pedido,
                titulo: template.titulo,
                observacao: template.observacao,
                prioridade: template.prioridade,
                ativo: !template.ativo
            });
            loadTemplates();
        } catch (error) {
            console.error('Erro ao atualizar template:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            tipoSolicitacao: '',
            estadoPedido: '',
            titulo: '',
            observacao: '',
            prioridade: 1,
            ativo: true
        });
        setEditingTemplate(null);
        setIsCreating(false);
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.observacao.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTipo = !filterTipo || template.tipo_solicitacao === filterTipo;
        const matchesEstado = !filterEstado || template.estado_pedido === filterEstado;
        return matchesSearch && matchesTipo && matchesEstado;
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">Templates de Observações</h2>
                            <p className="text-white/70 text-sm">Gerencie sugestões automáticas para observações</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all flex items-center space-x-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>Novo Template</span>
                    </button>
                </div>
            </div>

            {/* Create/Edit Form */}
            {isCreating && (
                <div className="p-8 bg-violet-50/50 border-b border-violet-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Tipo de Solicitação <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none font-medium"
                                    value={formData.tipoSolicitacao}
                                    onChange={e => setFormData({ ...formData, tipoSolicitacao: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {CALL_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Estado do Pedido <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none font-medium"
                                    value={formData.estadoPedido}
                                    onChange={e => setFormData({ ...formData, estadoPedido: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {CALL_STAGES.map(stage => (
                                        <option key={stage} value={stage}>{stage}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Prioridade
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none font-medium"
                                    value={formData.prioridade}
                                    onChange={e => setFormData({ ...formData, prioridade: parseInt(e.target.value) || 1 })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Estado
                                </label>
                                <div
                                    onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
                                    className={`flex items-center justify-between px-4 py-3 bg-white border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${formData.ativo ? 'border-emerald-300' : 'border-slate-200'}`}
                                >
                                    <span className={`text-sm font-bold ${formData.ativo ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {formData.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                    <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${formData.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${formData.ativo ? 'left-5.5' : 'left-0.5'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Título do Template <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none font-medium"
                                placeholder="Ex: Emissão de Carta de Quitação"
                                value={formData.titulo}
                                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Texto da Observação <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none font-medium"
                                placeholder="Digite o texto padrão da observação..."
                                value={formData.observacao}
                                onChange={e => setFormData({ ...formData, observacao: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-end space-x-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-3 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20"
                            >
                                {editingTemplate ? 'Atualizar Template' : 'Criar Template'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Buscar templates..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none font-medium"
                        value={filterTipo}
                        onChange={e => setFilterTipo(e.target.value)}
                    >
                        <option value="">Todos os Tipos</option>
                        {CALL_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <select
                        className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none font-medium"
                        value={filterEstado}
                        onChange={e => setFilterEstado(e.target.value)}
                    >
                        <option value="">Todos os Estados</option>
                        {CALL_STAGES.map(stage => (
                            <option key={stage} value={stage}>{stage}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Templates List */}
            <div className="p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <svg className="animate-spin h-8 w-8 text-violet-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-slate-500 font-medium">Nenhum template encontrado</p>
                        <p className="text-slate-400 text-sm mt-1">Crie um novo template para começar</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                className={`p-5 rounded-xl border transition-all ${template.ativo ? 'bg-white border-slate-200 hover:shadow-md' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-slate-800 truncate">{template.titulo}</h3>
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${template.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                                {template.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                            <span className="px-2 py-1 text-[10px] font-bold uppercase bg-violet-100 text-violet-700 rounded-md">
                                                Prioridade: {template.prioridade}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg">
                                                {template.tipo_solicitacao}
                                            </span>
                                            <span className="px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg">
                                                {template.estado_pedido}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2">{template.observacao}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleActive(template)}
                                            className={`p-2 rounded-lg transition-all ${template.ativo ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                            title={template.ativo ? 'Desativar' : 'Ativar'}
                                        >
                                            {template.ativo ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Remover"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{filteredTemplates.length} de {templates.length} templates</span>
                    <span>
                        <span className="text-emerald-600 font-medium">{templates.filter(t => t.ativo).length} ativos</span>
                        {' | '}
                        <span className="text-slate-400">{templates.filter(t => !t.ativo).length} inativos</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ObservationTemplatesManager;
