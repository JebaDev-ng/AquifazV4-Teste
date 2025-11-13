import { redirect } from 'next/navigation'

export default function ContentPricingRedirect() {
	redirect('/admin/products/pricing')
}
