import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from '../../context/ThemeContext'

const PALETTES = {
  dark: {
    knot: '#0d3b33',
    knotEmissive: '#14b8a6',
    orb: '#2dd4bf',
    lightA: '#5eead4',
    lightB: '#0f766e',
  },
  light: {
    knot: '#0f766e',
    knotEmissive: '#0d9488',
    orb: '#0d9488',
    lightA: '#99f6e4',
    lightB: '#134e4a',
  },
}

// A cluster of softly-lit torus knots + orbs drifting in space.
// Pointer-reactive parallax on the group; DPR-capped for performance.

function DriftingGroup({ palette }) {
  const group = useRef()
  const target = useRef({ x: 0, y: 0 })

  useFrame(({ pointer, clock }) => {
    if (!group.current) return
    target.current.x += (pointer.x * 0.35 - target.current.x) * 0.04
    target.current.y += (pointer.y * 0.25 - target.current.y) * 0.04
    group.current.rotation.y = target.current.x + clock.elapsedTime * 0.06
    group.current.rotation.x = -target.current.y * 0.5
  })

  const orbs = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        pos: [
          Math.sin((i / 7) * Math.PI * 2) * (2.2 + (i % 3) * 0.5),
          (Math.sin(i * 2.1) * 1.4),
          Math.cos((i / 7) * Math.PI * 2) * (2.2 + (i % 2) * 0.7),
        ],
        scale: 0.1 + (i % 4) * 0.06,
        speed: 0.6 + (i % 3) * 0.4,
      })),
    []
  )

  return (
    <group ref={group}>
      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh>
          <torusKnotGeometry args={[1, 0.28, 220, 36, 2, 3]} />
          <meshStandardMaterial
            color={palette.knot}
            roughness={0.15}
            metalness={0.9}
            emissive={palette.knotEmissive}
            emissiveIntensity={0.12}
          />
        </mesh>
      </Float>
      {orbs.map((o, i) => (
        <Float key={i} speed={o.speed} floatIntensity={1.4} rotationIntensity={0}>
          <mesh position={o.pos} scale={o.scale}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial
              color={palette.orb}
              roughness={0.3}
              metalness={0.4}
              emissive={palette.orb}
              emissiveIntensity={0.5}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

export default function AuroraScene({ className = '' }) {
  const { theme } = useTheme()
  const palette = PALETTES[theme] ?? PALETTES.dark

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={theme === 'light' ? 0.7 : 0.4} />
          <pointLight position={[6, 4, 6]} intensity={40} color={palette.lightA} />
          <pointLight position={[-6, -3, 2]} intensity={18} color={palette.lightB} />
          <DriftingGroup palette={palette} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}
