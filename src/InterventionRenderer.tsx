import * as Templates from "./components/interventions"
import interventions from "./data/interventions.json"

type Intervention = (typeof interventions)[0]

type Props = {
  intervention: Intervention
}

export default function InterventionRenderer({ intervention }: Props) {
  const { template, props } = intervention
  const Component = (Templates as any)[template]

  if (!Component) {
    return <div>❌ Template nicht gefunden: {template}</div>
  }

  return <Component {...props} />
}
