

## Plano: Cena 3D high-end com escritório futurista + Vini levitando

### Limpeza
- **Substituir** `src/components/vini/ViniScene.tsx` (atual: estrelas/Sparkles do tema espacial → será o novo cenário 3D imersivo).
- **Substituir** `src/components/vini/ViniAvatar.tsx` por uma versão "DOM-only" (apenas wrapper para clique + saudação), pois o avatar agora é renderizado **dentro** do Canvas 3D como um plano texturizado para participar da iluminação/parallax/bloom.
- **Manter intactos**: microfone central, menu lateral em abas de vidro, plus menu, header, bubbles, lógica de voz/`hasInteracted`/`scheduleHide` em `ViniHome.tsx`.
- **Não excluir** os assets atuais (`vini-avatar.png` continua sendo usado como textura). **Adicionar** o novo asset de fundo.

### Novos assets
- Copiar `user-uploads://Fundo_mais_distante.png` → `src/assets/office-bg.png` (cenário de escritório futurista).
- Copiar `user-uploads://Avatar_recortado_e_proporcional_ao_fundo.png` → `src/assets/vini-avatar.png` (substitui o atual, já transparente e proporcional).

### Dependência nova
- Instalar `@react-three/postprocessing@^2.16.3` (compatível com R3F v8, Three 0.160) para `EffectComposer` + `Bloom`.

### Arquitetura do novo `ViniScene.tsx` (Canvas full-screen, `pointer-events-none`)

```text
Canvas (camera z=5, fov=42, dpr=[1,1.6])
├─ <color background> + <fog>          ← profundidade ambiente
├─ Lights
│   ├─ ambientLight 0.35
│   ├─ directionalLight (key, frente-cima)
│   └─ pointLight CIANO atrás do Vini  ← simula portal iluminando costas
├─ Layer 0 — BackgroundPlane
│   ├─ planeGeometry [16,10] em z=-3
│   ├─ texture office-bg.png (sRGB)
│   └─ parallax: lerp posição com pointer * 0.05
├─ Layer 0.5 — StocksGlassPanel (à esquerda, z=-1.2)
│   ├─ boxGeometry slim
│   └─ MeshTransmissionMaterial { ior:1.5, transmission:1, chromaticAberration:0.06, roughness:0.05, thickness:0.4 }
├─ Layer 1 — ViniAvatarPlane (centro, z=0.5)
│   ├─ planeGeometry [2.4,2.4]
│   ├─ texture vini-avatar.png + meshStandardMaterial transparent + emissive sutil nos olhos via emissiveMap (mesma textura, intensidade baixa) → Bloom captura olhos
│   ├─ float: position.y = sin(t*2)*0.1
│   ├─ tilt: rotation.y/x lerp em direção ao pointer (intensidade 0.15 vs fundo 0.05)
│   └─ billboard parcial (sempre encarando câmera no eixo Y)
└─ EffectComposer
    └─ Bloom { intensity:0.9, luminanceThreshold:0.85, luminanceSmoothing:0.2, mipmapBlur:true }
```

### Hook de pointer (smoothing elástico)
- `usePointer()` reaproveitado: `target` (raw) + `smooth` (lerp 0.05 por frame em `useFrame`). Background usa `smooth * 0.05`, avatar usa `smooth * 0.15` → paralaxe real entre camadas.

### Mudanças em `ViniHome.tsx`
- Remover `<ViniAvatar onClick=... size=... />` do bloco central — o avatar agora vive dentro do Canvas.
- Manter o **wrapper invisível clicável** centralizado (`div` com `pointer-events-auto`) sobre a posição do avatar 3D, que dispara `handleAvatarClick` (abre menu/wakes Vini).
- Manter saudação, mic, menu lateral, bubbles **como overlays DOM** (z-index 20-40, acima do Canvas z-0).
- Remover os 2 overlays gradientes pesados do topo/base ou suavizá-los para `from-background/40` para não cobrir o cenário.

### Responsividade
- Canvas usa `dpr=[1,1.6]` e `frameloop='demand'` se `prefers-reduced-motion`.
- No mobile (`< 640px`): reduzir tamanho do plano do avatar para `[1.8, 1.8]`, mover painel de vidro para fora da tela (esconder) para não competir com mic.
- Hit-area do clique no avatar permanece HTML (centralizado), garantindo toque preciso.

### Detalhes técnicos
- Texturas carregadas via `useLoader(THREE.TextureLoader, …)` com `colorSpace = THREE.SRGBColorSpace`.
- `MeshTransmissionMaterial` do `@react-three/drei` (já instalado).
- Bloom seletivo: como Three 0.160 não tem layers selectiva trivial, usaremos `luminanceThreshold` alto (0.85) para que apenas regiões muito brilhantes (olhos amarelos do robô + emissões cianas do PointLight refletindo no plano) emitam glow — dispensa setup de layers.
- `pointer-events-none` no wrapper do Canvas garante que mic, menu e botões DOM recebam todos os toques.

### Arquivos tocados
1. `package.json` — adicionar `@react-three/postprocessing`
2. `src/assets/office-bg.png` (novo)
3. `src/assets/vini-avatar.png` (substituído)
4. `src/components/vini/ViniScene.tsx` (reescrito)
5. `src/components/vini/ViniAvatar.tsx` (reduzido a hit-area DOM + halo opcional)
6. `src/pages/ViniHome.tsx` (ajuste do bloco central + remoção dos gradientes pesados)

### Resultado esperado
Vini flutua em primeiro plano, painel de stocks à esquerda refrata o escritório atrás, fundo se desloca lentamente com o cursor enquanto o robô se desloca 3× mais rápido (paralaxe real), olhos e portal emitem brilho cinematográfico via Bloom, e toda a UI (mic, menus, header) continua funcional sobreposta.

