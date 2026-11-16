import { AlertTriangle } from 'lucide-react'
import { useStore } from '../store'
import { MEDICATION_INFO } from '../utils/medications'

// General information summarised from the medicines' patient leaflets. It
// describes; it never tells the user to change a dose.

export default function GuidePage() {
  const medicationName = useStore((s) => s.profile.medicationName)
  const info = MEDICATION_INFO[medicationName]
  const windowDays = info.missedDoseWindowDays

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h1 className="page-title">Guide</h1>
        <p className="page-subtitle">Practical notes for your {medicationName} routine.</p>
      </div>

      <section className="card" aria-labelledby="urgent-title" style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-soft)' }}>
        <h2 id="urgent-title" className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
          <AlertTriangle size={18} aria-hidden="true" /> Get medical help straight away if you have
        </h2>
        <ul className="muted-text guide-list" style={{ color: 'var(--text-body)' }}>
          <li>Severe stomach pain that does not go away, sometimes spreading to your back, with or without vomiting.</li>
          <li>Pain in the upper right of your stomach, fever, or yellowing of your skin or eyes.</li>
          <li>Vomiting or diarrhoea that stops you keeping fluids down, or signs of dehydration such as dizziness or passing very little urine.</li>
          <li>Swelling of the face, lips, tongue or throat, or difficulty breathing or swallowing.</li>
          <li>A lump or swelling in your neck, hoarseness, or trouble swallowing that does not go away.</li>
        </ul>
      </section>

      <div className="space-y-4">
        <details className="card guide-item" name="guide" open>
          <summary>Missed a dose?</summary>
          <p className="muted-text">
            The {medicationName} leaflet says: if it has been <strong>{windowDays} days ({windowDays * 24} hours) or less</strong> since
            the dose was due, take it as soon as you can. If it has been longer, skip the missed dose and take the next one on your usual day.
          </p>
          <p className="muted-text">Never take two doses to make up for a missed one. If you are unsure, ask your pharmacist or prescriber.</p>
        </details>

        <details className="card guide-item" name="guide">
          <summary>Rotating injection sites</summary>
          <p className="muted-text">
            You can inject into your stomach (at least 5 cm from your belly button), the front of your thighs, or the back of your upper arms.
            Use a different spot each week, even within the same area, to lower the chance of lumps and skin changes.
            Broono suggests the site you have used least recently each time you log.
          </p>
        </details>

        <details className="card guide-item" name="guide">
          <summary>Nausea and feeling full</summary>
          <ul className="muted-text guide-list">
            <li>Eat smaller meals, slowly, and stop as soon as you feel full.</li>
            <li>Bland, lower-fat foods are often easier; greasy or very sweet foods can make nausea worse.</li>
            <li>Sip fluids between meals rather than drinking a lot with them.</li>
            <li>Nausea is most common in the first weeks and after a dose increase, and usually eases.</li>
          </ul>
        </details>

        <details className="card guide-item" name="guide">
          <summary>Constipation and diarrhoea</summary>
          <ul className="muted-text guide-list">
            <li>Drink regularly through the day; with less appetite it is easy to drink less too.</li>
            <li>Build up fibre gradually with vegetables, fruit, oats, beans and wholegrains.</li>
            <li>Gentle activity such as walking helps keep things moving.</li>
            <li>With diarrhoea or vomiting, replace lost fluids and speak to a pharmacist if it lasts more than a day or two.</li>
          </ul>
        </details>

        <details className="card guide-item" name="guide">
          <summary>Protein, hydration and muscle</summary>
          <p className="muted-text">
            Eating less makes it harder to get enough protein, and some weight lost can be muscle. Protein at each meal and regular strength exercise
            help protect it. Use the daily targets on Home to keep an eye on protein and water, and agree your goals with your care team.
          </p>
        </details>

        <details className="card guide-item" name="guide">
          <summary>Other medicines and contraception</summary>
          <p className="muted-text">
            If you also take insulin or a sulfonylurea for diabetes, your blood sugar can drop lower than usual; your prescriber may adjust those medicines.
            {info.ingredient === 'tirzepatide'
              ? ' Tirzepatide can make oral contraceptive pills less reliable for 4 weeks after starting and after each dose increase; the leaflet advises a barrier method alongside, or a non-oral method.'
              : ' Tell your prescriber if you are pregnant, planning a pregnancy or breastfeeding.'}
          </p>
        </details>
      </div>

      <p className="muted-text" style={{ textAlign: 'center', paddingBottom: 8 }}>
        General information based on the patient leaflets. It is not medical advice: always follow your prescriber's and pharmacist's instructions.
      </p>
    </div>
  )
}
