import { DynamoDB } from "aws-sdk"
import dynamodb from "../dynamodb"
import type { IRecordFeeData } from "../../handlers/storeFees"
import { Item } from "./base"

export enum FeeType {
    dailyFees = "df",
    dailyRevenue = "dr"
}

export class Fee extends Item {
    data: IRecordFeeData
    type: FeeType
    protocolId: string
    timestamp: number

    constructor(type: FeeType, protocolId: string, timestamp: number, data: IRecordFeeData) {
        super()
        this.data = data
        this.type = type
        this.protocolId = protocolId
        this.timestamp = timestamp
    }

    static fromItem(item?: DynamoDB.AttributeMap): Fee {
        if (!item) throw new Error("No item!")
        if (!item.PK || !item.SK) throw new Error("Bad item!")
        // PK=df#dex#{id}
        // TODO: update dynamodb types with correct sdk
        const protocolId = (item.PK as string).split("#")[2]
        const recordType = (item.PK as string).split("#")[0] as FeeType
        const body = item as IRecordFeeData
        const timestamp = +item.SK
        delete body.PK;
        delete body.SK;
        return new Fee(recordType, protocolId, timestamp, body)
    }

    get pk(): string {
        return `${this.type}#${this.protocolId}`
    }

    get sk(): number {
        return this.timestamp
    }

    toItem(): Record<string, unknown> {
        return {
            ...this.keys(),
            ...this.data
        }
    }
}

export const storeFees = async (fee: Fee): Promise<Fee> => {
    if (Object.entries(fee.data).length === 0) throw new Error("Can't store empty fee")
    try {
        await dynamodb.update({
            Key: fee.keys(),
            UpdateExpression: createUpdateExpressionFromObj(fee.data),
            ExpressionAttributeValues: createExpressionAttributeValuesFromObj(fee.data)
        }) // Upsert like
        return fee
    } catch (error) {
        throw error
    }
}

function createUpdateExpressionFromObj(obj: IRecordFeeData): string {
    return `set ${Object.keys(obj).map(field => `${field}=:${field}`).join(',')}`
}

function createExpressionAttributeValuesFromObj(obj: IRecordFeeData): Record<string, unknown> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        return {
            ...acc,
            [`:${key}`]: value
        }
    }, {} as Record<string, unknown>)
}

export const getFees = async (protocolId: string, type: FeeType, mode: "ALL" | "LAST" = "ALL"): Promise<Fee[] | Fee> => {
    // Creating dummy object to get the correct key
    const fee = new Fee(type, protocolId, null!, null!)
    try {
        const resp = await dynamodb.query({
            // TODO: Change for upsert like
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": fee.pk,
            },
            Limit: mode === "LAST" ? 1 : undefined,
            ScanIndexForward: mode === "LAST" ? false : undefined
        })
        if (!resp.Items || resp.Items.length === 0) throw Error(`No items found for ${fee.pk}`)
        return mode === "LAST" ? Fee.fromItem(resp.Items[0]) : resp.Items.map(Fee.fromItem)
    } catch (error) {
        throw error
    }
}
