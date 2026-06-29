import { DependencyService } from "./DependencyService"
import { IdentityAttributeDependencyService } from "./IdentityAttributeDependencyService"
import { TransformDependencyService } from "./TransformDependencyService"

export class DependencyServiceFactory {
    constructor(
        private readonly tenantId: string,
        private readonly tenantName: string,
        private readonly tenantDisplayname: string,
        private readonly resourceType: string,
        private readonly resourceId: string,
        private readonly resourceName: string,
        private readonly label: string
    ) {

    }

    getService(): DependencyService {
        switch (this.resourceType) {
            case "identity-attribute":
                return new IdentityAttributeDependencyService(
                    this.tenantId,
                    this.tenantName,
                    this.tenantDisplayname,
                    this.resourceType,
                    this.resourceId,
                    this.resourceName,
                    this.label
                )
            case "transform":
                return new TransformDependencyService(
                    this.tenantId,
                    this.tenantName,
                    this.tenantDisplayname,
                    this.resourceType,
                    this.resourceId,
                    this.resourceName,
                    this.label
                )
            default: throw new Error("invalid resourceType")
        }
    }
}