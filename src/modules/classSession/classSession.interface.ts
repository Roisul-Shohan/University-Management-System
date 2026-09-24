export interface CreateClassSessionInput {
	courseOfferingId: string;
	date: Date;
	startTime: Date;
	endTime: Date;
	topic?: string;
	meetingLink?: string;
}

export interface UpdateClassSessionInput {
	date?: Date;
	startTime?: Date;
	endTime?: Date;
	topic?: string | null;
	meetingLink?: string | null;
}

export interface GetClassSessionsQuery {
	courseOfferingId?: string;
	from?: Date;
	to?: Date;
}
