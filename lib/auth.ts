// Función para hashear contraseñas usando Web Crypto API (solo en cliente)
export async function hashPassword(password: string): Promise<string> {
  // Solo ejecutar en el cliente donde crypto.subtle está disponible
  if (typeof window === 'undefined') {
    throw new Error('hashPassword can only be called on the client side')
  }
  
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Función para verificar contraseñas
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // 1. Genera el nuevo hash SHA-256 (que debería ser idéntico al guardado)
  const passwordHash = await hashPassword(password);
  
  // 2. Limpia ambas cadenas para eliminar cualquier espacio invisible
  const cleanedPasswordHash = passwordHash.trim();
  const cleanedStoredHash = hash.trim();
  
  // Imprime las cadenas limpias para la verificación visual final
  console.log(cleanedPasswordHash, ' === ', cleanedStoredHash);
  
  // 3. Compara las cadenas limpias
  const isMatch = cleanedPasswordHash === cleanedStoredHash;
  
  console.log('condicion', isMatch);
  return isMatch;
}