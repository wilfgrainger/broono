import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { MEDICATIONS } from '../store'
import ChoiceGroup from '../components/ChoiceGroup'
import DoseInput from '../components/DoseInput'
import { formatDose } from '../utils/medications'
import type { WeightUnit, UserProfile } from '../store'
import { ArrowRight, ArrowLeft, Check, Syringe, Target, CalendarDays, Activity, Lock } from 'lucide-react'
import ReviewRow from '../components/ReviewRow'
import WeightField from '../components/WeightField'
import { WEIGHT_UNIT_OPTIONS, convertWeight, formatWeight, getWeightUnitName, validateWeight } from '../utils/weight'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const LAST_STEP = 5
const WEIGHT_STEP = 2
const STEP_TITLES = ['Welcome', 'Medication details', 'Starting vitals', 'Daily goals', 'Injection schedule', 'Review']

export default function Onboarding() {
    const completeOnboarding = useStore((s) => s.completeOnboarding)
    const updateProfile = useStore((s) => s.updateProfile)
    const setWeightUnit = useStore((s) => s.setWeightUnit)
    const initialProfile = useStore((s) => s.profile)

    const [step, setStep] = useState(0)
    const [localProfile, setLocalProfile] = useState<UserProfile>(initialProfile)

    const [weightError, setWeightError] = useState('')
    const contentRef = useRef<HTMLDivElement>(null)
    const weightInputRef = useRef<HTMLInputElement>(null)
    const previousStep = useRef(step)

    useEffect(() => {
        document.title = `${STEP_TITLES[step]} (step ${step + 1} of ${LAST_STEP + 1}) | Broono`
    }, [step])

    // Each step replaces the content, so move focus to the new step's heading.
    useEffect(() => {
        if (previousStep.current === step) return
        previousStep.current = step
        contentRef.current?.querySelector<HTMLElement>('h1, h2')?.focus()
    }, [step])

    const handlePrev = () => setStep((s) => Math.max(s - 1, 0))

    // One submit handler drives every step, so Enter in a field advances too.
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()

        const validWeight = validateWeight(localProfile.startWeight, localProfile.weightUnit)
        if (step >= WEIGHT_STEP && validWeight === null) {
            setStep(WEIGHT_STEP)
            setWeightError(localProfile.startWeight > 0
                ? 'That weight does not look right. Check the number and the unit.'
                : `Enter your starting weight in ${getWeightUnitName(localProfile.weightUnit).toLowerCase()} to continue.`)
            weightInputRef.current?.focus()
            return
        }

        if (step < LAST_STEP) {
            setStep((s) => s + 1)
            return
        }

        const { weightUnit, ...rest } = localProfile
        setWeightUnit(weightUnit)
        updateProfile({
            ...rest,
            startWeight: validWeight ?? 0,
            goalWeight: validateWeight(rest.goalWeight, weightUnit) ?? 0,
            treatmentStartDate: rest.treatmentStartDate || new Date().toLocaleDateString('en-CA'),
        })
        completeOnboarding()
    }

    const updateLocal = (updates: Partial<UserProfile>) => {
        setLocalProfile((prev) => ({ ...prev, ...updates }))
    }

    // Keep an already-entered weight meaningful when the unit changes.
    const changeUnit = (unit: WeightUnit) => {
        setLocalProfile((prev) => ({
            ...prev,
            weightUnit: unit,
            startWeight: convertWeight(prev.startWeight, prev.weightUnit, unit),
            goalWeight: convertWeight(prev.goalWeight, prev.weightUnit, unit),
        }))
        setWeightError('')
    }

    return (
        <form className="onboarding-wrapper fade-in" onSubmit={handleSubmit} noValidate aria-label="Set up Broono" style={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg)',
            color: 'var(--text)',
            position: 'relative',
            paddingBottom: '80px' // for fixed bottom bar
        }}>
            {/* Header Progress */}
            <div style={{ padding: '24px 20px 12px' }}>
                <div
                    role="progressbar"
                    aria-label="Setup progress"
                    aria-valuemin={1}
                    aria-valuemax={LAST_STEP + 1}
                    aria-valuenow={step + 1}
                    aria-valuetext={`Step ${step + 1} of ${LAST_STEP + 1}: ${STEP_TITLES[step]}`}
                    style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}
                >
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
                        type="button"
                        onClick={handlePrev}
                        style={{
                            minHeight: 44,
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
                        <ArrowLeft size={16} aria-hidden="true" /> Back
                    </button>
                )}
            </div>

            <div ref={contentRef} style={{ flex: 1, padding: '12px 20px 24px', width: '100%', maxWidth: 520, margin: '0 auto' }}>
                {step === 0 && (
                    <Slide transitionKey="0">
                        <h1 tabIndex={-1} style={{ fontSize: '2rem', marginBottom: '16px', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
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
                                    <Activity size={20} color="var(--primary)" aria-hidden="true" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Track Progress</h2>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>Log your weekly weight & symptoms</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Syringe size={20} color="var(--primary)" aria-hidden="true" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Dose Tracking</h2>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>Stay on top of your injection schedule</p>
                                </div>
                            </div>
                        </div>
                    </Slide>
                )}

                {step === 1 && (
                    <Slide transitionKey="1">
                        <h1 tabIndex={-1} style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Medication Details</h1>
                        <p id="onboarding-medication-label" style={{ color: 'var(--text-light)', marginBottom: '24px' }}>What medication are you taking?</p>

                        <ChoiceGroup
                            legend="Medication"
                            hideLegend
                            name="onboarding-medication"
                            layout="stack"
                            options={MEDICATIONS.map((value) => ({ value, label: value }))}
                            value={localProfile.medicationName}
                            onChange={(medicationName) => updateLocal({ medicationName })}
                        />
                        <div style={{ marginTop: 24 }}>
                            <DoseInput
                                key={localProfile.medicationName}
                                id="dose-input"
                                label="Current dose (optional)"
                                medication={localProfile.medicationName}
                                value={localProfile.doseMg}
                                onChange={(doseMg) => updateLocal({ doseMg })}
                            />
                        </div>
                    </Slide>
                )}

                {step === 2 && (
                    <Slide transitionKey="2">
                        <h1 tabIndex={-1} style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Starting Vitals</h1>
                        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>Let's set your baseline. You can change the unit later in Settings.</p>

                        <div style={{ marginBottom: 24 }}>
                            <ChoiceGroup
                                legend="Unit"
                                name="onboarding-unit"
                                layout="stack"
                                options={WEIGHT_UNIT_OPTIONS.map(({ unit, label }) => ({ value: unit, label }))}
                                value={localProfile.weightUnit}
                                onChange={changeUnit}
                            />
                        </div>

                        <WeightField
                            key={localProfile.weightUnit}
                            label="Starting Weight"
                            unit={localProfile.weightUnit}
                            value={localProfile.startWeight > 0 ? localProfile.startWeight : null}
                            onChange={(next) => {
                                updateLocal({ startWeight: next ?? 0 })
                                if (weightError) setWeightError('')
                            }}
                            error={weightError}
                            inputRef={weightInputRef}
                            enterKeyHint="next"
                        />
                        <div style={{ marginTop: 24 }}>
                            <WeightField
                                key={`goal-${localProfile.weightUnit}`}
                                label="Goal weight (optional)"
                                unit={localProfile.weightUnit}
                                value={localProfile.goalWeight > 0 ? localProfile.goalWeight : null}
                                onChange={(next) => updateLocal({ goalWeight: next ?? 0 })}
                                enterKeyHint="next"
                            />
                        </div>
                    </Slide>
                )}

                {step === 3 && (
                    <Slide transitionKey="3">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Target size={24} color="var(--primary)" aria-hidden="true" />
                            <h1 tabIndex={-1} style={{ margin: 0, fontSize: '1.5rem' }}>Daily Goals</h1>
                        </div>
                        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>Set your daily targets to stay on track.</p>

                        <div style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '20px',
                            marginBottom: '16px'
                        }}>
                            <p style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                                <label htmlFor="water-goal-input">Hydration Goal</label>
                                <span style={{ color: 'var(--brand-mid)' }}>{localProfile.waterGoalGlasses} glasses</span>
                            </p>
                            <input
                                id="water-goal-input"
                                name="waterGoal"
                                aria-valuetext={`${localProfile.waterGoalGlasses} glasses`}
                                type="range"
                                min="1"
                                max="20"
                                value={localProfile.waterGoalGlasses}
                                onChange={(e) => updateLocal({ waterGoalGlasses: parseInt(e.target.value, 10) })}
                                style={{ width: '100%', accentColor: 'var(--primary)' }}
                            />
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>about {Number((localProfile.waterGoalGlasses * 0.25).toFixed(2))} litres, at 250 ml a glass</p>
                        </div>

                        <div style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '20px'
                        }}>
                            <p style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                                <label htmlFor="protein-goal-input">Protein Goal</label>
                                <span style={{ color: 'var(--brand-mid)' }}>{localProfile.proteinGoalG}g</span>
                            </p>
                            <input
                                id="protein-goal-input"
                                name="proteinGoal"
                                aria-valuetext={`${localProfile.proteinGoalG} grams`}
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
                            <CalendarDays size={24} color="var(--primary)" aria-hidden="true" />
                            <h1 tabIndex={-1} style={{ margin: 0, fontSize: '1.5rem' }}>Injection Schedule</h1>
                        </div>
                        <p id="onboarding-day-label" style={{ color: 'var(--text-light)', marginBottom: '24px' }}>When do you take your dose?</p>

                        <ChoiceGroup
                            legend="Injection day"
                            hideLegend
                            name="onboarding-day"
                            layout="stack"
                            options={DAY_NAMES.map((day, index) => ({ value: `${index}`, label: day }))}
                            value={`${localProfile.injectionDayOfWeek}`}
                            onChange={(value) => updateLocal({ injectionDayOfWeek: Number(value) })}
                        />
                    </Slide>
                )}

                {step === 5 && (
                    <Slide transitionKey="5">
                        <h1 tabIndex={-1} style={{ fontSize: '1.5rem', marginBottom: '8px' }}>You're all set!</h1>
                        <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>Review your details below.</p>

                        <div style={{
                            background: 'var(--success-soft)',
                            border: '1px solid var(--success-border)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <Lock size={18} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
                            <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5, margin: 0 }}>
                                <strong>Your data is private.</strong> All health information entered here and in the app is saved <em>locally on your device</em>. Broono has no server to send it to.
                            </p>
                        </div>

                        <dl style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <ReviewRow label="Medication" value={localProfile.doseMg > 0 ? `${localProfile.medicationName} (${formatDose(localProfile.doseMg)})` : localProfile.medicationName} />
                            <ReviewRow label="Start Weight" value={formatWeight(localProfile.startWeight, localProfile.weightUnit)} />
                            {localProfile.goalWeight > 0 ? <ReviewRow label="Goal Weight" value={formatWeight(localProfile.goalWeight, localProfile.weightUnit)} /> : null}
                            <ReviewRow label="Injection Day" value={DAY_NAMES[localProfile.injectionDayOfWeek]} />
                            <ReviewRow label="Water Goal" value={`${localProfile.waterGoalGlasses} glasses`} />
                            <ReviewRow label="Protein Goal" value={`${localProfile.proteinGoalG}g`} />
                        </dl>
                    </Slide>
                )}
            </div>

            {/* Fixed Bottom Action */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px 20px max(20px, env(safe-area-inset-bottom))',
                background: 'linear-gradient(to top, var(--bg) 80%, transparent)',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    {step < LAST_STEP
                        ? <>Continue <ArrowRight size={18} aria-hidden="true" /></>
                        : <>Get Started <Check size={18} aria-hidden="true" /></>}
                </button>
            </div>
        </form>
    )
}

function Slide({ children, transitionKey }: { children: React.ReactNode, transitionKey: string }) {
    return (
        <div key={transitionKey} className="slide-up" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            {children}
        </div>
    )
}
