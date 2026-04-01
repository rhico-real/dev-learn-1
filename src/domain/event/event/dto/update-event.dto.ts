import { Injectable } from "@nestjs/common";
import { PartialType } from '@nestjs/mapped-types';
import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString } from "class-validator";
import { CreateEventDto } from "./create-event.dto";

@Injectable()
export class UpdateEventDto extends PartialType(CreateEventDto) { }