'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateSecuritySettings() {
  revalidatePath('/settings/securitySettings', 'page')
}
