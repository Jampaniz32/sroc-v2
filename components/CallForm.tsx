
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, CallStage, CallType, Entity, CallRecord } from '../types';
import { CALL_STAGES, CALL_TYPES, ENTITIES, AGENCIES } from '../constants';
import { clientsAPI, observationTemplatesAPI } from '../services/api';
import { formatName, formatPhone, formatNuit, formatObservations, toTitleCase, formatFormData } from '../utils';

interface ObservationSuggestion {
  id: string;
  titulo: string | null;
  observacao: string;
  prioridade: number;
  source: 'template' | 'historical';
  frequency?: number;
}

interface CallFormProps {
  onAdd: (record: any) => void;
  user: User;
  initialData?: CallRecord;
}

interface ClientSearchResult {
  id: string;
  nuit: string;
  nome: string;
  entidade: string;
  agencia: string;
  contacto: string;
  whatsapp: boolean;
}

const CallForm: React.FC<CallFormProps> = ({ onAdd, user, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientFound, setClientFound] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    nuit: initialData?.nuit || '',
    cliente: initialData?.cliente || '',
    entidade: initialData?.entidade || '',
    agencia: initialData?.agencia || '',
    estagio: initialData?.estagio || CallStage.ABERTO,
    contacto: initialData?.contacto || '',
    tipoPedido: initialData?.tipoPedido || CallType.COTACAO,
    outroTipoPedido: initialData?.outroTipoPedido || '',
    whatsapp: initialData?.whatsapp || false,
    observacoes: initialData?.observacoes || ''
  });

  // Estados para sugestão inteligente de observações
  const [observationSuggestions, setObservationSuggestions] = useState<ObservationSuggestion[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<string>('');
  const [showSuggestionDropdown, setShowSuggestionDropdown] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [userHasTyped, setUserHasTyped] = useState(false);
  const observationRef = useRef<HTMLTextAreaElement>(null);
  const suggestionTimeout = useRef<NodeJS.Timeout | null>(null);

  const nuitSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounced NUIT search
  const searchClientByNuit = useCallback(async (nuit: string) => {
    if (nuit.length < 5) {
      setClientFound(null);
      return;
    }

    setIsSearchingClient(true);
    try {
      const result = await clientsAPI.searchByNuit(nuit);
      if (result.found && result.client) {
        const client: ClientSearchResult = result.client;
        setFormData(prev => ({
          ...prev,
          cliente: formatName(client.nome) || prev.cliente,
          entidade: client.entidade || prev.entidade,
          agencia: client.agencia || prev.agencia,
          contacto: formatPhone(client.contacto) || prev.contacto,
          whatsapp: client.whatsapp || prev.whatsapp
        }));
        setClientFound(true);
      } else {
        setClientFound(false);
      }
    } catch (error) {
      console.error('Error searching client:', error);
      setClientFound(null);
    } finally {
      setIsSearchingClient(false);
    }
  }, []);

  const handleNuitChange = (value: string) => {
    setFormData({ ...formData, nuit: value });
    setClientFound(null);

    // Clear previous timeout
    if (nuitSearchTimeout.current) {
      clearTimeout(nuitSearchTimeout.current);
    }

    // Set new timeout for search (debounce 500ms)
    if (value.length >= 5) {
      nuitSearchTimeout.current = setTimeout(() => {
        searchClientByNuit(value);
      }, 500);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (nuitSearchTimeout.current) {
        clearTimeout(nuitSearchTimeout.current);
      }
      if (suggestionTimeout.current) {
        clearTimeout(suggestionTimeout.current);
      }
    };
  }, []);

  // Buscar sugestões de observação quando tipo ou estado mudam
  const fetchObservationSuggestions = useCallback(async (tipoPedido: string, estagio: string) => {
    if (!tipoPedido || !estagio) {
      setObservationSuggestions([]);
      setCurrentSuggestion('');
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const result = await observationTemplatesAPI.getSuggestions(tipoPedido, estagio);
      if (result.suggestions && result.suggestions.length > 0) {
        setObservationSuggestions(result.suggestions);
        // Se o usuário não digitou nada, mostrar a primeira sugestão como placeholder
        if (!userHasTyped && !formData.observacoes) {
          setCurrentSuggestion(result.suggestions[0].observacao);
        }
      } else {
        setObservationSuggestions([]);
        setCurrentSuggestion('');
      }
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setObservationSuggestions([]);
      setCurrentSuggestion('');
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [userHasTyped, formData.observacoes]);

  // Effect para buscar sugestões quando tipo ou estado mudam
  useEffect(() => {
    // Debounce a busca de sugestões
    if (suggestionTimeout.current) {
      clearTimeout(suggestionTimeout.current);
    }

    suggestionTimeout.current = setTimeout(() => {
      fetchObservationSuggestions(formData.tipoPedido, formData.estagio);
    }, 300);

    return () => {
      if (suggestionTimeout.current) {
        clearTimeout(suggestionTimeout.current);
      }
    };
  }, [formData.tipoPedido, formData.estagio, fetchObservationSuggestions]);

  // Handler para aceitar sugestão
  const acceptSuggestion = (suggestion: string) => {
    setFormData({ ...formData, observacoes: suggestion });
    setShowSuggestionDropdown(false);
    setUserHasTyped(true);
    if (observationRef.current) {
      observationRef.current.focus();
    }
  };

  // Handler para tecla ENTER no campo de observações
  const handleObservationKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Se ENTER é pressionado e há uma sugestão exibida e o campo está vazio
    if (e.key === 'Enter' && !e.shiftKey && currentSuggestion && !formData.observacoes.trim()) {
      e.preventDefault();
      acceptSuggestion(currentSuggestion);
    }
  };

  // Handler para duplo clique no campo de observações
  const handleObservationDoubleClick = () => {
    if (currentSuggestion && !formData.observacoes.trim()) {
      acceptSuggestion(currentSuggestion);
    }
  };

  // Handler para mudança no campo de observações
  const handleObservationChange = (value: string) => {
    setFormData({ ...formData, observacoes: value });
    if (value.trim()) {
      setUserHasTyped(true);
      // Limpar sugestão se usuário começar a digitar
      if (!value.includes(currentSuggestion)) {
        setCurrentSuggestion('');
      }
    } else {
      setUserHasTyped(false);
      // Restaurar sugestão quando campo fica vazio
      if (observationSuggestions.length > 0) {
        setCurrentSuggestion(observationSuggestions[0].observacao);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.tipoPedido === CallType.OUTRO && !formData.outroTipoPedido) {
      alert("Por favor, forneça mais detalhes sobre o tipo de pedido no campo 'Especificação'.");
      return;
    }

    setIsSubmitting(true);

    // Aplicar formatação automática a todos os campos
    const formattedData = formatFormData(formData);

    // Atualizar estado com dados formatados
    setFormData(formattedData);

    // Save/update client data if NUIT is provided
    if (formattedData.nuit && formattedData.nuit.length >= 5) {
      try {
        await clientsAPI.create({
          nuit: formattedData.nuit,
          nome: formattedData.cliente,
          entidade: formattedData.entidade,
          agencia: formattedData.agencia,
          contacto: formattedData.contacto,
          whatsapp: formattedData.whatsapp
        });
      } catch (error) {
        console.error('Error saving client:', error);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 400));
    onAdd(formattedData);

    // Só reseta se NÃO for edição
    if (!initialData) {
      setFormData({
        nuit: '', cliente: '', entidade: '', agencia: '',
        estagio: CallStage.ABERTO, contacto: '', tipoPedido: CallType.COTACAO,
        outroTipoPedido: '', whatsapp: false, observacoes: ''
      });
      setClientFound(null);
    }

    setIsSubmitting(false);
  };

  return (
    <div className={`max-w-5xl mx-auto ${!initialData ? 'animate-in fade-in slide-in-from-bottom-8 duration-500' : ''}`}>
      <form onSubmit={handleSubmit} className={`space-y-6 ${!initialData ? 'pb-20' : ''}`}>

        {/* Bloco 1: Informação do Cliente */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-50/50 dark:bg-slate-700/30 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Identificação do Cliente</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Informação Básica e Contacto</p>
              </div>
            </div>

            {/* Client Status Badge */}
            {isSearchingClient && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span className="text-xs font-bold text-blue-600">A procurar...</span>
              </div>
            )}
            {!isSearchingClient && clientFound === true && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg animate-in fade-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold text-emerald-600">Cliente Existente</span>
              </div>
            )}
            {!isSearchingClient && clientFound === false && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg animate-in fade-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold text-amber-600">Novo Cliente</span>
              </div>
            )}
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* NUIT Field - Com busca inteligente */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                NUIT
                {clientFound === true && (
                  <span className="text-emerald-500 text-[9px] normal-case">• Dados preenchidos</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text" disabled={isSubmitting}
                  className={`w-full px-5 py-3 rounded-xl border bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 transition-all outline-none font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 ${clientFound === true
                    ? 'border-emerald-300 focus:ring-emerald-500/10 focus:border-emerald-500'
                    : clientFound === false
                      ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                      : 'border-slate-200 focus:ring-indigo-500/10 focus:border-indigo-500'
                    }`}
                  value={formData.nuit}
                  onChange={e => handleNuitChange(e.target.value)}
                  onBlur={e => setFormData({ ...formData, nuit: formatNuit(e.target.value) })}
                  placeholder="Digite o NUIT para busca automática"
                />
                {isSearchingClient && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Completo do Cliente <span className="text-rose-500">*</span></label>
              <input
                type="text" required disabled={isSubmitting}
                className={`w-full px-5 py-3 rounded-xl border bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 ${clientFound === true ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                value={formData.cliente}
                onChange={e => setFormData({ ...formData, cliente: e.target.value })}
                onBlur={e => setFormData({ ...formData, cliente: formatName(e.target.value) })}
                placeholder="Ex: Albino Mondlane"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Telemóvel / Contacto <span className="text-rose-500">*</span></label>
              <input
                type="tel" required disabled={isSubmitting}
                className={`w-full px-5 py-3 rounded-xl border bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 ${clientFound === true ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                value={formData.contacto}
                onChange={e => setFormData({ ...formData, contacto: e.target.value })}
                onBlur={e => setFormData({ ...formData, contacto: formatPhone(e.target.value) })}
                placeholder="+258 8x xxx xxxx"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Entidade</label>
              <div className="relative">
                <select
                  disabled={isSubmitting}
                  className={`w-full px-5 py-3 rounded-xl border bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none disabled:opacity-50 ${clientFound === true ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                  value={formData.entidade}
                  onChange={e => setFormData({ ...formData, entidade: e.target.value })}
                >
                  <option value="">Selecione a Entidade...</option>
                  {ENTITIES.map(ent => (
                    <option key={ent} value={ent}>{ent}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Agência</label>
              <div className="relative">
                <select
                  disabled={isSubmitting}
                  className={`w-full px-5 py-3 rounded-xl border bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none disabled:opacity-50 ${clientFound === true ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                  value={formData.agencia}
                  onChange={e => setFormData({ ...formData, agencia: e.target.value })}
                >
                  <option value="">Selecione a Agência...</option>
                  {AGENCIES.map(agency => (
                    <option key={agency} value={agency}>{agency}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Canal WhatsApp</label>
              <div
                onClick={() => !isSubmitting && setFormData({ ...formData, whatsapp: !formData.whatsapp })}
                className={`flex items-center justify-between px-5 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors group ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className={`text-[11px] font-bold ${formData.whatsapp ? 'text-emerald-600' : 'text-slate-400'}`}>Recebido via WhatsApp</span>
                <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${formData.whatsapp ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${formData.whatsapp ? 'left-5.5' : 'left-0.5'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Detalhes do Pedido */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-50/50 dark:bg-slate-700/30 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 dark:shadow-blue-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Detalhes do Atendimento</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Classificação e Resolução</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tipo de Solicitação <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select
                    disabled={isSubmitting}
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none disabled:opacity-50"
                    value={formData.tipoPedido}
                    onChange={e => setFormData({ ...formData, tipoPedido: e.target.value as CallType })}
                  >
                    {CALL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Estado do Pedido</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CALL_STAGES.map(stage => (
                    <button
                      key={stage}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setFormData({ ...formData, estagio: stage as CallStage })}
                      className={`px-3 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${formData.estagio === stage
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formData.tipoPedido === CallType.OUTRO && (
              <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest ml-1">Especificação do Motivo <span className="text-rose-500">*</span></label>
                <input
                  type="text" required disabled={isSubmitting}
                  className="w-full px-5 py-3 rounded-xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50"
                  value={formData.outroTipoPedido}
                  onChange={e => setFormData({ ...formData, outroTipoPedido: e.target.value })}
                  onBlur={e => setFormData({ ...formData, outroTipoPedido: toTitleCase(e.target.value) })}
                  placeholder="Descreva detalhadamente o motivo"
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Notas / Observações</label>
                {observationSuggestions.length > 0 && (
                  <div className="flex items-center gap-2">
                    {isLoadingSuggestions ? (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Carregando...
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSuggestionDropdown(!showSuggestionDropdown)}
                        className="text-[10px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 uppercase tracking-wider transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                        </svg>
                        {observationSuggestions.length} Sugestões
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${showSuggestionDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Dropdown de sugestões */}
              {showSuggestionDropdown && observationSuggestions.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800 rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 bg-violet-50 dark:bg-violet-950/30 border-b border-violet-100 dark:border-violet-900">
                    <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Sugestões Disponíveis</p>
                    <p className="text-[9px] text-violet-500 mt-0.5">Clique para inserir ou pressione ENTER no campo vazio</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {observationSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => acceptSuggestion(suggestion.observacao)}
                        className={`w-full text-left px-4 py-3 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${index === 0 ? 'bg-violet-50/50 dark:bg-violet-950/30' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {suggestion.titulo && (
                              <p className="text-xs font-bold text-slate-700 truncate">{suggestion.titulo}</p>
                            )}
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">{suggestion.observacao}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {suggestion.source === 'template' ? (
                              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase bg-violet-100 text-violet-700 rounded">Template</span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase bg-slate-100 text-slate-600 rounded">Histórico</span>
                            )}
                            {index === 0 && (
                              <span className="text-[8px] text-violet-500 font-medium">Recomendada</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Campo de observações com placeholder inteligente */}
              <div className="relative">
                <textarea
                  ref={observationRef}
                  rows={4}
                  disabled={isSubmitting}
                  className={`w-full px-5 py-4 rounded-xl border bg-slate-50/30 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700 dark:text-slate-200 leading-relaxed text-sm disabled:opacity-50 ${currentSuggestion && !formData.observacoes ? 'border-violet-200 dark:border-violet-800' : 'border-slate-200 dark:border-slate-700'}`}
                  value={formData.observacoes}
                  onChange={e => handleObservationChange(e.target.value)}
                  onKeyDown={handleObservationKeyDown}
                  onDoubleClick={handleObservationDoubleClick}
                  onBlur={e => setFormData({ ...formData, observacoes: formatObservations(e.target.value) })}
                  placeholder={currentSuggestion || 'Insira detalhes relevantes sobre este atendimento...'}
                  style={currentSuggestion && !formData.observacoes ? { color: '#64748b' } : undefined}
                ></textarea>

                {/* Indicador de sugestão disponível */}
                {currentSuggestion && !formData.observacoes && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    <span className="text-[9px] text-violet-500 font-medium bg-violet-50 px-2 py-1 rounded-md">
                      💡 Pressione ENTER para aceitar a sugestão
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold max-w-xs text-center sm:text-left uppercase tracking-tight">
            {initialData
              ? `A editar registo criado por ${initialData.agenteNome}`
              : `Este registo será assinado pelo utilizador @${user.username}.`}
          </p>
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            {!initialData && (
              <button
                type="reset"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all disabled:opacity-50"
                onClick={() => {
                  setFormData({
                    nuit: '', cliente: '', entidade: '', agencia: '',
                    estagio: CallStage.ABERTO, contacto: '',
                    tipoPedido: CallType.COTACAO, outroTipoPedido: '',
                    whatsapp: false, observacoes: ''
                  });
                  setClientFound(null);
                }}
              >
                Limpar Tudo
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-12 py-3.5 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center space-x-3"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isSubmitting ? 'A Gravar...' : (initialData ? 'Guardar Alterações' : 'Confirmar Registo')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CallForm;
