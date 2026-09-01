import { highlightMarkers } from '@/components/common/highlightMarkers'

export function MarkerText({ text, inline = false }: { text: string; inline?: boolean }) {
  return <>{highlightMarkers(text, inline)}</>
}
