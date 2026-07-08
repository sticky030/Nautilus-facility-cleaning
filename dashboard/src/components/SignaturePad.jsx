import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'

const SignaturePad = forwardRef(({ label }, ref) => {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useImperativeHandle(ref, () => ({
    getDataURL: () => isEmpty ? null : canvasRef.current.toDataURL('image/png'),
    clear: () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setIsEmpty(true)
    },
    isEmpty: () => isEmpty
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    function getPos(e) {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      if (e.touches) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        }
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }

    function start(e) {
      e.preventDefault()
      drawing.current = true
      const pos = getPos(e)
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }

    function draw(e) {
      e.preventDefault()
      if (!drawing.current) return
      const pos = getPos(e)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      setIsEmpty(false)
    }

    function stop(e) {
      e.preventDefault()
      drawing.current = false
    }

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stop)
    canvas.addEventListener('mouseleave', stop)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', stop)

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stop)
      canvas.removeEventListener('mouseleave', stop)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stop)
    }
  }, [])

  return (
    <div>
      {label && (
        <label style={{
          display: 'block', fontSize: '10.5px', fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--mt)', marginBottom: '8px', fontFamily: 'inherit'
        }}>{label}</label>
      )}
      <div style={{
        border: '1px solid #cbd5e1', borderRadius: '10px',
        overflow: 'hidden', background: '#ffffff', position: 'relative'
      }}>
        <canvas
          ref={canvasRef}
          width={500} height={150}
          style={{ width: '100%', height: '120px', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
        />
        {isEmpty && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'inherit' }}>
              Hier unterschreiben
            </span>
          </div>
        )}
      </div>
      <button type="button"
        onClick={() => {
          const canvas = canvasRef.current
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
          setIsEmpty(true)
        }}
        style={{
          marginTop: '6px', fontSize: '11px', color: 'var(--c)',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', padding: 0
        }}>
        Zurücksetzen
      </button>
    </div>
  )
})

SignaturePad.displayName = 'SignaturePad'
export default SignaturePad
