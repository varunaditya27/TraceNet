'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { initGraph } from '@/lib/d3-graph'
import { useDemoStore } from '@/store/demo-store'
import { NodeTooltip } from './NodeTooltip'
import { ALGORITHM_MODULES } from '@/lib/algorithms'
import { buildAlgorithmLessons } from '@/lib/algorithm-lessons'
import { getExecutionProgram } from '@/lib/execution'
import type { AlgorithmId, GraphData, GraphNode } from '@/lib/graph-data'

function GraphLegend() {
  return (
    <details className="graph-legend">
      <summary>Visual legend</summary>
      <div className="legend-grid">
        <span><i className="legend-node eskape" /> ESKAPE target</span>
        <span><i className="legend-node bridge" /> Bridge species</span>
        <span><i className="legend-node environmental" /> Environmental source</span>
        <span><i className="legend-node active" /> Current / active node</span>
        <span><i className="legend-line weighted" /> Link width = Jaccard weight</span>
        <span><i className="legend-line arrow" /> Active direction</span>
        <span><i className="legend-line removed" /> Removed pathway</span>
        <span><i className="legend-fade" /> Muted = not active or unreachable</span>
        <span><b>0, 1, infinity</b> Hop / order labels</span>
        <span><b>Glow / reveal</b> Newly changed state</span>
      </div>
    </details>
  )
}

function AlgorithmGraph({ data, selectedAlgo }: { data: GraphData; selectedAlgo: AlgorithmId }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentStep, executionMode, setTotalSteps, setPhaseStarts, setStep } = useDemoStore()
  const [tooltip, setTooltip] = useState<{ node: GraphNode; x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const lesson = buildAlgorithmLessons(data)[selectedAlgo]
  const program = useMemo(() => getExecutionProgram(data, selectedAlgo), [data, selectedAlgo])
  const steps = executionMode === 'full' ? program.full : program.guided
  const activeStep = steps[currentStep] ?? steps[0]

  useEffect(() => {
    if (!svgRef.current) return
    initGraph(svgRef.current, data)
    const svg = d3.select(svgRef.current) as d3.Selection<SVGSVGElement, unknown, null, undefined>
    const algorithmModule = ALGORITHM_MODULES[selectedAlgo]
    setTotalSteps(steps.length)
    setPhaseStarts(executionMode === 'full' ? (program.phaseStarts ?? [0]) : [0])
    svg.selectAll<SVGCircleElement, unknown>('.node-circle')
      .on('mouseenter', function (event: MouseEvent) {
        const id = Number(d3.select(this).attr('data-id'))
        const node = data.nodes[id]
        if (!node || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setTooltip({ node, x: event.clientX - rect.left, y: event.clientY - rect.top })
      })
      .on('mouseleave', () => setTooltip(null))

    return () => {
      svg.selectAll('*').interrupt()
      algorithmModule.exit(svg, data)
    }
  }, [data, selectedAlgo, executionMode, steps.length, program.phaseStarts, setPhaseStarts, setTotalSteps])

  useEffect(() => {
    setStep(0)
  }, [executionMode, selectedAlgo, setStep])

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current) as d3.Selection<SVGSVGElement, unknown, null, undefined>
    svg.selectAll('*').interrupt()
    ALGORITHM_MODULES[selectedAlgo].enter(svg, data, activeStep?.phaseIndex ?? currentStep, activeStep?.visualState, currentStep)
  }, [activeStep, currentStep, data, selectedAlgo])

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await containerRef.current.requestFullscreen()
  }

  return (
    <section ref={containerRef} className="graph-stage" aria-label={`${lesson.title} visualization`}>
      <div className="dot-grid" />
      <div className="graph-caption">
        <span>{lesson.title}</span>
        <strong>{activeStep?.title}</strong>
      </div>
      <div className="graph-view-controls">
        <button onClick={() => setZoom(value => Math.max(0.8, value - 0.1))} aria-label="Zoom out">−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(value => Math.min(1.8, value + 0.1))} aria-label="Zoom in">+</button>
        <button onClick={() => setZoom(1)}>Reset</button>
        <button onClick={toggleFullscreen}>Fullscreen</button>
      </div>
      <GraphLegend />
      <svg
        ref={svgRef}
        viewBox="0 0 1140 670"
        preserveAspectRatio="xMidYMid meet"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 180ms ease' }}
      />
      {tooltip && <NodeTooltip node={tooltip.node} position={{ x: tooltip.x, y: tooltip.y }} />}
    </section>
  )
}

export function GraphCanvas({ data }: { data: GraphData }) {
  const selectedAlgo = useDemoStore(state => state.selectedAlgo)
  return <AlgorithmGraph key={selectedAlgo} data={data} selectedAlgo={selectedAlgo} />
}
