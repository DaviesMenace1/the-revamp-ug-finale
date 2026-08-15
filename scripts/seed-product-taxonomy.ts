import { seedProductTaxonomy } from "@/lib/db/seed/product-taxonomy"

async function main() {
	await seedProductTaxonomy()
	console.log("Product taxonomy seeded successfully")
	process.exit(0)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})