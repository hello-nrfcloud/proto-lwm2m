import type { MeasurementType, SenMLType } from './SenMLSchema'
import { timestampResources } from '../lwm2m/timestampResources.js'

type LwM2MObject = {
	ObjectID: number
	ObjectVersion: string
	Resources: Record<number, string | number | boolean | Date>
}
type MeasurementWithObjectInfo = MeasurementType & {
	bn: number
	blv: string
	bt: number
}
const isObjectInfo = (
	measurement: MeasurementType,
): measurement is MeasurementWithObjectInfo => 'bn' in measurement

const getValue = (
	measurement: MeasurementType,
): string | number | boolean | undefined => {
	if ('bv' in measurement && !('v' in measurement)) return measurement.bv
	if ('bv' in measurement && 'v' in measurement)
		return measurement.bv + measurement.v
	if ('v' in measurement) return measurement.v
	if ('vs' in measurement) return measurement.vs
	if ('vb' in measurement) return measurement.vb
	if ('vd' in measurement) return measurement.vd
	return undefined
}
export const senMLtoLwM2M = (senML: SenMLType): Array<LwM2MObject> => {
	let currentObject: LwM2MObject | undefined = undefined
	const items: LwM2MObject[] = []

	for (const item of senML) {
		if (isObjectInfo(item)) {
			if (currentObject !== undefined) items.push(currentObject)
			const tsRes = timestampResources[item.bn]
			if (tsRes === undefined)
				throw new Error(`Unknown LwM2M Object ID: ${item.bn}!`)
			currentObject = {
				ObjectID: item.bn,
				ObjectVersion: item.blv ?? '1.0',
				Resources: {
					[tsRes]: new Date(item.bt),
				},
			}
		}
		if (currentObject?.Resources === undefined) continue
		const value = getValue(item)
		if (value !== undefined) {
			currentObject.Resources = {
				...currentObject.Resources,
				[item.n]: value,
			}
		}
	}
	if (currentObject !== undefined) items.push(currentObject)

	return items
}