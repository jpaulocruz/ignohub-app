'use client'

import { useState, useEffect } from 'react'
import { LucideCheckCircle2, LucideCopy, LucideLoader2, LucideMessageSquare, LucideShield, LucideSearch, LucideEye, LucideUsers, LucideX } from 'lucide-react'
import { createGroupAction, verifyGroupConnection } from '@/app/(dashboard)/groups/actions'
import { createClient } from '@/lib/supabase/client'

interface Preset {
    id: string
    name: string
    description: string
    contact_info: string
    icon: string
}

interface OnboardingWizardProps {
    organizationId: string
    onClose: () => void
    onSuccess: () => void
}

export function OnboardingWizard({ organizationId, onClose, onSuccess }: OnboardingWizardProps) {
    const [step, setStep] = useState(1)
    const [presets, setPresets] = useState<Preset[]>([])
    const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null)
    const [groupName, setGroupName] = useState('')
    const [platform, setPlatform] = useState('whatsapp')
    const [loading, setLoading] = useState(false)
    const [createdGroupId, setCreatedGroupId] = useState<string | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<'pending' | 'active' | 'checking'>('pending')
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        async function fetchPresets() {
            const { data } = await (supabase as any).from('agent_presets').select('*')
            if (data) setPresets(data)
        }
        fetchPresets()
    }, [])

    const handleCreateGroup = async () => {
        if (!selectedPreset || !groupName) return
        setLoading(true)
        setError(null)

        const result = await createGroupAction({
            name: groupName,
            platform,
            presetId: selectedPreset.id,
            organizationId
        }) as any

        if (result.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        if (result.data) {
            setCreatedGroupId(result.data.id)
            setStep(2)
        }
        setLoading(false)
    }

    const handleVerifyConnection = async () => {
        if (!createdGroupId) return
        setConnectionStatus('checking')

        const result = await verifyGroupConnection(createdGroupId)

        if (result.status === 'active') {
            setConnectionStatus('active')
            setTimeout(() => {
                onSuccess()
                onClose()
            }, 2000)
        } else {
            setConnectionStatus('pending')
            setError('Agente ainda pendente. Certifique-se de que o bot é administrador e enviou uma mensagem de teste.')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const renderStep1 = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
                <h2 className="text-3xl font-black text-white tracking-tighter">1. Escolha o Especialista</h2>
                <p className="text-zinc-400 font-medium">Selecione o preset de IA que melhor se adapta às necessidades do seu grupo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset)}
                        className={`p-6 rounded-3xl border text-left transition-all ${selectedPreset?.id === preset.id
                            ? 'bg-indigo-600/10 border-indigo-600 shadow-lg shadow-indigo-600/10'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${selectedPreset?.id === preset.id ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                            {preset.name === 'Sentinel' && <LucideShield className="h-5 w-5" />}
                            {preset.name === 'Hunter' && <LucideSearch className="h-5 w-5" />}
                            {preset.name === 'Observer' && <LucideEye className="h-5 w-5" />}
                            {preset.name === 'Concierge' && <LucideUsers className="h-5 w-5" />}
                        </div>
                        <h4 className="font-black text-white">{preset.name}</h4>
                        <p className="text-sm text-zinc-500 mt-1 font-medium leading-tight">{preset.description}</p>
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nome do Grupo</label>
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Ex: Comunidade de Investidores"
                        className="w-full bg-zinc-900 border-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 transition-all font-medium text-sm"
                    />
                </div>
            </div>

            <button
                disabled={!selectedPreset || !groupName || loading}
                onClick={handleCreateGroup}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
                {loading ? <LucideLoader2 className="h-5 w-5 animate-spin" /> : 'CONTINUAR'}
            </button>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
                <h2 className="text-3xl font-black text-white tracking-tighter">2. Convide o Especialista</h2>
                <p className="text-zinc-400 font-medium">Adicione o robô ao seu grupo e conceda as permissões necessárias.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Contato do Bot</p>
                        <p className="text-xl font-mono text-white font-bold">{selectedPreset?.contact_info}</p>
                    </div>
                    <button
                        onClick={() => copyToClipboard(selectedPreset?.contact_info || '')}
                        className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-zinc-400 transition-colors"
                    >
                        <LucideCopy className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-indigo-600/10 border border-indigo-600/20 text-indigo-600 flex items-center justify-center text-[10px] font-black">1</div>
                        <p className="text-zinc-300 text-sm font-medium">Adicione o número acima ao seu grupo no WhatsApp/Telegram.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-indigo-600/10 border border-indigo-600/20 text-indigo-600 flex items-center justify-center text-[10px] font-black">2</div>
                        <p className="text-zinc-300 text-sm font-medium">Promova o bot a <span className="text-white font-black">ADMINISTRADOR</span> do grupo.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-indigo-600/10 border border-indigo-600/20 text-indigo-600 flex items-center justify-center text-[10px] font-black">3</div>
                        <p className="text-zinc-300 text-sm font-medium">Certifique-se de que o bot tem acesso às mensagens.</p>
                    </div>
                </div>
            </div>

            <button
                onClick={() => setStep(3)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl transition-all"
            >
                JA ADICIONEI
            </button>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
            <div className="space-y-4">
                <h2 className="text-3xl font-black text-white tracking-tighter">3. Validar Conexão</h2>
                <p className="text-zinc-400 font-medium">Estamos verificando se o especialista já está ativo no grupo.</p>
            </div>

            <div className="flex flex-col items-center justify-center py-12">
                {connectionStatus === 'active' ? (
                    <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <LucideCheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                        <p className="text-green-500 font-black tracking-widest text-[10px] uppercase">CONECTADO COM SUCESSO</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className={`w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center ${connectionStatus === 'checking' ? 'animate-pulse' : ''}`}>
                            {connectionStatus === 'checking' ? (
                                <LucideLoader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                            ) : (
                                <LucideMessageSquare className="h-12 w-12 text-zinc-700" />
                            )}
                        </div>
                        <p className="text-zinc-500 font-black tracking-widest text-[10px] uppercase">
                            {connectionStatus === 'checking' ? 'VERIFICANDO...' : 'AGUARDANDO CONEXÃO'}
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {error && (
                    <p className="text-red-500 text-xs font-bold bg-red-500/10 border border-red-500/20 p-4 rounded-xl">{error}</p>
                )}

                {connectionStatus !== 'active' && (
                    <button
                        disabled={connectionStatus === 'checking'}
                        onClick={handleVerifyConnection}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all"
                    >
                        VERIFICAR CONEXÃO
                    </button>
                )}
            </div>
        </div>
    )

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-950/95 backdrop-blur-xl p-6 overflow-y-auto">
            <div className="max-w-2xl w-full bg-zinc-900/50 border border-zinc-800 p-10 rounded-[40px] shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
                >
                    <LucideX className="h-6 w-6" />
                </button>

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
        </div>
    )
}
