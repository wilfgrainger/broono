import { useState } from 'react'
import { useStore } from '../store'
import type { MedicationName, WeightUnit, UserProfile } from '../store'
import { ArrowRight, ArrowLeft, Check, Syringe, Target, CalendarDays, Activity, Lock } from 'lucide-react'
import ReviewRow from '../components/ReviewRow'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function Onboarding() {
    const completeOnboarding = useStore((s) => s.completeOnboarding)
    const updateProfile = useStore((s) => s.updateProfile)
    const initialProfile = useStore((s) => s.profile)

    const [step, setStep] = useState(0)
    const [localProfile, setLocalProfile] = useState<UserProfile>(initialProfile)

    const handleNext = () => setStep((s) => Math.min(s + 1, 5))
    const handlePrev = () => setStep((s) => Math.max(s - 1, 0))

    const handleComplete = () => {
        updateProfile(localProfile)
        completeOnboarding()
    }

    const updateLocal = (updates: Partial<UserProfile>) => {
        setLocalProfile((prev) => ({ ...prev, ...updates }))
    }

    return (
        <div className="onboarding-wrapper fade-in" style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg)',
            color: 'var(--text)',
            position: 'relative',
            paddingBottom: '80px' // for fixed bottom bar
        }}>
            {/* Header Progress */}
            <div style={{ padding: '24px 20px 12px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div
                            key={i}
                            style={{
                                height: '4px',
                                flex: 1,
                                borderRadius: '2px',
                                background: i <= step ? 'var(--primary)' : 'var(--border)',
                                transition: 'background 0.3s ease'
                            }}
                        />
                    ))}
                </div>
                {step > 0 && (
                    <button
                        onClick={handlePrev}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-light)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            padding: '8px 0',
                            fontFamily: 'inherit',
                            fontWeight: 500,
                            fontSize: '0.9rem'
                        }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 24px' }}>
                {step === 0 && (
                    <Slide transitionKey="0">
                        <h1 style={{ fontSize: '2rem', marginBottom: '16px', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                            Welcome to<br />
                            <span style={{ fontWeight: 800 }}>broono<span style={{ color: 'var(--primary)' }}>.</span></span>
                        </h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', lineHeight: 1.5, marginBottom: '32px' }}>
                            Your personal companion for GLP-1 weight loss progress, journaling, and tracking.
                        </p>
                        <div style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={20} color="var(--primary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Track Progress</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>Log your weekly weight & symptoms</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Syringe size={20} color="var(--primary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Dose Tracking</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>Stay on top of your injection schedule</p>
                                </div>
                            </div>
                        </div>
                    </Slide>
                )}

                {step === 1 && (
                    <Slide transitionKey="1">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Medication Details</h2>
                        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>What medication are you taking?</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                            {(['Zepbound', 'Mounjaro', 'Wegovy', 'Ozempic'] as MedicationName[]).map(med => (
                                <PillSelect
                                    key={med}
                                    active={localProfile.medicationName === med}
                                    onClick={() => updateLocal({ medicationName: med })}
                                >
                                    {med}
                                </PillSelect>
                            ))}
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Current Dose</h3>
                        <input
                            type="text"
                            className="form-input"
                            value={localProfile.dose}
                            onChange={(e) => updateLocal({ dose: e.target.value })}
                            placeholder="e.g. 2.5mg, 5mg"
                        />
                    </Slide>
                )}

                {step === 2 && (
                    <Slide transitionKey="2">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Starting Vitals</h2>
                        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>Let's set your baseline.</p>

                        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Unit</h3>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            {(['lbs', 'kg'] as WeightUnit[]).map(u => (
                                <PillSelect
                                    key={u}
                                    active={localProfile.weightUnit === u}
                                    onClick={() => updateLocal({ weightUnit: u })}
                                    style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                                >
                                    {u}
                                </PillSelect>
                            ))}
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Starting Weight</h3>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="number"
                                className="form-input"
                                style={{ paddingRight: '48px' }}
                                value={localProfile.startWeight || ''}
                                onChange={(e) => updateLocal({ startWeight: parseFloat(e.target.value) || 0 })}
                                placeholder="0.0"
                            />
                            <span style={{
                                position: 'absolute',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-light)',
                                fontWeight: 600
                            }}>{localProfile.weightUnit}</span>
                        </div>
                    </Slide>
                )}

                {step === 3 && (
                    <Slide transitionKey="3">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Target size={24} color="var(--primary)" />
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Daily Goals</h2>
                        </div>
                        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>Set your daily targets to stay on track.</p>

                        <div style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '20px',
                            marginBottom: '16px'
                        }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Hydration Goal</span>
                                <span style={{ color: 'var(--primary)' }}>{localProfile.waterGoalGlasses} glasses</span>
                            </h3>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={localProfile.waterGoalGlasses}
                                onChange={(e) => updateLocal({ waterGoalGlasses: parseInt(e.target.value, 10) })}
                                style={{ width: '100%', accentColor: 'var(--primary)' }}
                            />
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>approx {Math.round(localProfile.waterGoalGlasses * 8)} oz</p>
                        </div>

                        <div style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Protein Goal</span>
                                <span style={{ color: 'var(--primary)' }}>{localProfile.proteinGoalG}g</span>
                            </h3>
                            <input
                                type="range"
                                min="30"
                                max="250"
                                step="5"
                                value={localProfile.proteinGoalG}
                                onChange={(e) => updateLocal({ proteinGoalG: parseInt(e.target.value, 10) })}
                                style={{ width: '100%', accentColor: 'var(--primary)' }}
                            />
                        </div>
                    </Slide>
                )}

                {step === 4 && (
                    <Slide transitionKey="4">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <CalendarDays size={24} color="var(--primary)" />
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Injection Schedule</h2>
                        </div>
                        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>When do you take your dose?</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {DAY_NAMES.map((day, idx) => (
                                <PillSelect
                                    key={day}
                                    active={localProfile.injectionDayOfWeek === idx}
                                    onClick={() => updateLocal({ injectionDayOfWeek: idx })}
                                >
                                    {day}
                                </PillSelect>
                            ))}
                        </div>
                    </Slide>
                )}

                {step === 5 && (
                    <Slide transitionKey="5">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>You're all set!</h2>
                        <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>Review your details below.</p>

                        <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <Lock size={18} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.5, margin: 0 }}>
                                <strong>Your data is private.</strong> All health information entered here and in the app is saved <em>locally on your device</em> and is never sent to our servers.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <ReviewRow label="Medication" value={`${localProfile.medicationName} (${localProfile.dose})`} />
                            <ReviewRow label="Start Weight" value={`${localProfile.startWeight} ${localProfile.weightUnit}`} />
                            <ReviewRow label="Injection Day" value={DAY_NAMES[localProfile.injectionDayOfWeek]} />
                            <ReviewRow label="Water Goal" value={`${localProfile.waterGoalGlasses} glasses`} />
                            <ReviewRow label="Protein Goal" value={`${localProfile.proteinGoalG}g`} />
                        </div>
                    </Slide>
                )}
            </div>

            {/* Fixed Bottom Action */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px',
                background: 'linear-gradient(to top, var(--bg) 80%, transparent)',
                display: 'flex',
                justifyContent: 'center'
            }}>
                {step < 5 ? (
                    <button
                        className="btn-primary"
                        style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={handleNext}
                    >
                        Continue <ArrowRight size={18} />
                    </button>
                ) : (
                    <button
                        className="btn-primary"
                        style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={handleComplete}
                    >
                        Get Started <Check size={18} />
                    </button>
                )}
            </div>
        </div>
    )
}

function Slide({ children, transitionKey }: { children: React.ReactNode, transitionKey: string }) {
    return (
        <div key={transitionKey} className="slide-up" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            {children}
        </div>
    )
}

function PillSelect({ active, onClick, children, style = {} }: { active: boolean, onClick: () => void, children: React.ReactNode, style?: React.CSSProperties }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                background: active ? 'var(--primary-light)' : 'var(--card-bg)',
                color: active ? 'var(--primary)' : 'var(--text)',
                fontWeight: active ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '1rem',
                ...style
            }}
        >
            {children}
        </button>
    )
}

