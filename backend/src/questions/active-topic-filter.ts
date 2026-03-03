export class ActiveTopicFilter {
    private readonly now: Date;

    constructor(private readonly topics: Array<{ name: string; enabled: boolean; startDate?: Date; endDate?: Date }>) {
        this.now = new Date();
    }

    getActiveNames(): string[] {
        return this.topics
            .filter(topic => this.isActive(topic))
            .map(topic => topic.name);
    }

    private isActive(topic: { enabled: boolean; startDate?: Date; endDate?: Date }): boolean {
        if (!topic.enabled) return false;
        if (topic.startDate && new Date(topic.startDate) > this.now) return false;
        if (topic.endDate && new Date(topic.endDate) < this.now) return false;
        return true;
    }
}
