/*
	Original code from http://matt.stumpnet.net/
	Modified by http://quickmind.co.uk/tank.html
*/

/////////////
// Globals //
/////////////
var WIDTH = window.innerWidth - 30;
var HEIGHT = window.innerHeight - 30;
var MOVE_RANGE = 100;
var MOVE_PROB = 0.01;
var RESTARTING = false;
var MAX_MOVE_ANGLE = 2;
var MIN_SEPERATION_OF_STARTING_BASES = 200;
var SHELL_DAMAGE_RADIUS = 30;
var BOMB_DAMAGE_RADIUS = 20;
var MISSLE_ACCELERATION = 0.3;
var MISSLE_ROTATION = 1.5;
var MAX_MISSLE_ROTATION = .4;
var MIN_BASE_DISTANCE_SQUARE = 5000;

/////////////////
// New Globals //
/////////////////
var MAX_UNITS_ON_MAP = 100;
var BASE_HEAL_RADIUS = 50;

var TankStateEnum = {
	IDLE : 0,
	MOVE : 1,
	TARGET_AQUIRED : 2,
	TARGET_IN_RANGE : 3,
	CRASH_AND_BURN : 4,
	EVASIVE_ACTION : 5 // New : Moving units can take evasive actions to retreat and heal
}

var ShotTypeEnum = {
	NONE   : 0,
	BULLET : 1,
	SHELL  : 2,
	MISSLE : 3,
	BOMB   : 4
}

var TankKindEnum = {
	TANK    : 0,
	BASE    : 1,
	BUILDER : 2,
	TURRET  : 3,
	PLANE   : 4
}

//////////
// Init //
//////////
var canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
//if(!canvas.getContext){return;}
var ctx = canvas.getContext("2d");
//ctx.width = WIDTH;
//ctx.height = HEIGHT;

var Teams = [];
Teams[0] = new Team(new Color(255, 0, 0),'Red');
Teams[1] = new Team(new Color(0, 255, 0),'Green');
Teams[2] = new Team(new Color(0, 0, 255),'Blue');
Teams[3] = new Team(new Color(0, 255, 255),'Cyan');
Teams[4] = new Team(new Color(255, 0, 255),'Purple');
Teams[5] = new Team(new Color(255, 255, 0),'Yellow');
Teams[6] = new Team(new Color(0, 0, 0),'Black');
Teams[7] = new Team(new Color(255, 255, 255),'White');

var TankTypes = [];
//Small Tank:
TankTypes[0] = {Kind : TankKindEnum.TANK, 
				AttackingUnit :  true, 
				Prob : 120, 
				MoveSpeed : 1.4, 
				TurnSpeed : .18, 
				TurretTurnSpeed : .19, 
				Radius : 10, 
				HitPoints : 30, 
				CooldownTime :  25,
				MinRange : 10, 
				AttackDistance : 100, 
				AttackRange : 125, 
				SightDistance : 200, 
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 30, 
				BulletSpeed : 6, 
				BulletDamage : 3, 
				TurretSize : 5, 
				BarrelLength : 10,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : 50};
//Medium Tank
TankTypes[1] = {Kind : TankKindEnum.TANK, 
				AttackingUnit :  true, 
				Prob : 120, 
				MoveSpeed : 1.0, 
				TurnSpeed : .13, 
				TurretTurnSpeed : .16, 
				Radius : 10, 
				HitPoints : 50, 
				CooldownTime : 35, 
				MinRange : 25, 
				AttackDistance : 115, 
				AttackRange : 140, 
				SightDistance : 200, 
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 34, 
				BulletSpeed : 6, 
				BulletDamage : 4, 
				TurretSize : 6, 
				BarrelLength : 12,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : 50};
//Large Tank
TankTypes[2] = {Kind : TankKindEnum.TANK, 
				AttackingUnit : true,
				Prob : 120,
				MoveSpeed : 0.8, 
				TurnSpeed : .09, 
				TurretTurnSpeed : .14,
				Radius : 10, 
				HitPoints : 75,
				CooldownTime : 50, 
				MinRange : 25, 
				AttackDistance : 130, 
				AttackRange : 155, 
				SightDistance : 200, 
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 38, 
				BulletSpeed : 6, 
				BulletDamage : 6, 
				TurretSize : 7,
				BarrelLength : 14,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : 50};
//Artillery
TankTypes[3] = {Kind : TankKindEnum.TANK, 
				AttackingUnit : true, 
				Prob : 60, 
				MoveSpeed : 0.9, 
				TurnSpeed : .07, 
				TurretTurnSpeed : 0.12, 
				Radius : 10, 
				HitPoints : 25, 
				CooldownTime : 75, 
				MinRange : 50, 
				AttackDistance : 375,
				AttackRange : 380,
				SightDistance : 380, 
				BulletType : ShotTypeEnum.SHELL,
				BulletTime :  41, 
				BulletSpeed : 4, 
				BulletDamage : 15, 
				TurretSize : 0, 
				BarrelLength :  16,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : 50};
//Double Tank
TankTypes[4] = {Kind : TankKindEnum.TANK,
				AttackingUnit : true,
				Prob : 80,
				MoveSpeed : 0.7,
				TurnSpeed : .07, 
				TurretTurnSpeed : 0.12, 
				Radius : 10, 
				HitPoints : 85, 
				CooldownTime : 70,
				MinRange : 25,
				AttackDistance : 130,
				AttackRange : 155,
				SightDistance : 200,
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 42, 
				BulletSpeed : 6, 
				BulletDamage : 5,
				TurretSize : 7,
				BarrelLength : 14,
				DoubleTurret : true,
				TurretSeparation : 1.25,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : 50};

//Missle Launcher
TankTypes[5] = {Kind : TankKindEnum.TANK,
				AttackingUnit : true,
				Prob : 90,
				MoveSpeed : 1.0,
				TurnSpeed : .07, 
				TurretTurnSpeed : 0.13, 
				Radius : 10, 
				HitPoints : 35, 
				CooldownTime : 70,
				MinRange : 25,
				AttackDistance : 130,
				AttackRange : 155,
				SightDistance : 200,
				BulletType : ShotTypeEnum.MISSLE,
				BulletTime : 40, 
				BulletSpeed : 6, 
				BulletDamage : 8,
				TurretSize : 0,
				BarrelLength : 5,
				DoubleTurret : true,
				TurretSeparation : 2.5,
				AntiAircraft : true,
				CanGoEvasive : false,
				EvaProb : 0
				};
//Turret
TankTypes[6] = {Kind : TankKindEnum.TURRET,
				AttackingUnit : true,
				Prob : 20,
				MoveSpeed : 0,
				TurnSpeed : 0, 
				TurretTurnSpeed : 0.16, 
				Radius : 7, 
				HitPoints : 200, 
				CooldownTime : 25,
				MinRange : 10,
				AttackDistance : 150,
				AttackRange : 150,
				SightDistance : 150,
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 30, 
				BulletSpeed : 6, 
				BulletDamage : 4,
				TurretSize : 6,
				BarrelLength : 12,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : false,
				EvaProb : 0};				
//AA Turret
TankTypes[7] = {Kind : TankKindEnum.TURRET,
				AttackingUnit : true,
				Prob : 50,
				MoveSpeed : 0,
				TurnSpeed : 0, 
				TurretTurnSpeed : 0.14, 
				Radius : 7, 
				HitPoints : 145, 
				CooldownTime : 7,
				MinRange : 10,
				AttackDistance : 300, //130
				AttackRange : 300, //130
				SightDistance : 300, //130
				BulletType : ShotTypeEnum.BULLET,
				BulletTime : 30, 
				BulletSpeed : 10, 
				BulletDamage : 10,
				TurretSize : 4,
				BarrelLength : 6,
				DoubleTurret : true,
				TurretSeparation : 4,
				AntiAircraft : true,
				CanGoEvasive : false,
				EvaProb : 0};				

//Constructor
TankTypes[8] = {Kind : TankKindEnum.BUILDER, 
				AttackingUnit : false, 
				Prob : 30, 
				MoveSpeed : 1.3, 
				TurnSpeed : .13, 
				TurretTurnSpeed : 0, 
				Radius : 10, 
				HitPoints : 100, 
				CooldownTime : 500, 
				MinRange : 0, 
				AttackDistance : 0,
				AttackRange : 0,
				SightDistance : 200, 
				BulletType : ShotTypeEnum.NONE,
				BulletTime :  0, 
				BulletSpeed : 0, 
				BulletDamage : 0, 
				TurretSize : 0, 
				BarrelLength :  0,
				DoubleTurret : false,
				CanGoEvasive : true,
				EvaProb : 50};

//Bomber
TankTypes[9] = {Kind : TankKindEnum.PLANE, 
				AttackingUnit : true, 
				Prob : 20, 
				MoveSpeed : 2.5, 
				TurnSpeed : .08, 
				TurretTurnSpeed : .5, 
				Radius : 12, 
				HitPoints : 40, 
				CooldownTime : 6, 
				MinRange : 10, 
				AttackDistance : 60,
				AttackRange : 60,
				SightDistance : 250, 
				BulletType : ShotTypeEnum.BOMB,
				BulletTime :  40, 
				BulletSpeed : 1, 
				BulletDamage : 20, 
				BarrelLength :  0,
				DoubleTurret : false,
				AntiAircraft : false,
				CanGoEvasive : true,
				EvaProb : 50};

//Fighter
TankTypes[10] = {Kind : TankKindEnum.PLANE, 
				AttackingUnit : true, 
				Prob : 0, 
				MoveSpeed : 3.5, 
				TurnSpeed : .12, 
				TurretTurnSpeed : .15, 
				Radius : 12, 
				HitPoints : 30, 
				CooldownTime : 100, 
				MinRange : 10, 
				AttackDistance : 350,
				AttackRange : 350,
				SightDistance : 500, 
				BulletType : ShotTypeEnum.MISSLE,
				BulletTime :  60, 
				BulletSpeed : 10, 
				BulletDamage : 8, 
				BarrelLength :  0,
				DoubleTurret : true,
				TurretSeparation : 4,
				AntiAircraft : true,
				CanGoEvasive : true,
				EvaProb : 50};

//Base
var BaseType = {Kind : TankKindEnum.BASE, 
				AttackingUnit : false, 
				Prob : 0, 
				MoveSpeed : 0, 
				TurnSpeed : 0, 
				TurretTurnSpeed : 0, 
				Radius : 10,
				HitPoints : 1000, 
				CooldownTime : 200, 
				MinRange : 0, 
				AttackDistance : 0, 
				AttackRange : 0, 
				SightDistance : 200, 
				BulletType : ShotTypeEnum.NONE,
				BulletTime : 0, 
				BulletSpeed : 0, 
				BulletDamage : 0, 
				TurretSize : 0, 
				BarrelLength :  0,
				DoubleTurret : false,
				CanGoEvasive : false,
				EvaProb : 0};

var TotalProb;

var TotalUnits;

var Tanks = new Set("tankIndex");

var Bullets = new Set("bulletIndex");

var Explosions = new Set("explosionIndex");

var Smokes = new Set("smokeIndex");

var DebrisSet = new Set("debrisIndex");

//Start:
restart();
timer();

/*var mTimer = setInterval(function(){
	window.mTeams = new Object;
	for ( mtank in Tanks )
	{
		if ( !isNaN(mtank) )
		{
			if ( typeof window.mTeams[Tanks[mtank].getTeamnum()] == 'undefined' ) {
				window.mTeams[Tanks[mtank].getTeamnum()] = new Object;
				window.mTeams[Tanks[mtank].getTeamnum()].score = 1;
				window.mTeams[Tanks[mtank].getTeamnum()].colorstring = Tanks[mtank].getTeam().getColor().getColorString();
				//console.debug(Tanks[mtank]);
			}
			else {
				window.mTeams[Tanks[mtank].getTeamnum()].score = window.mTeams[Tanks[mtank].getTeamnum()].score + 1;
			}
		}
	}
},5000);*/

/////////////
// Classes //
/////////////
//----- Set class  -----
function Set(indexName) {
	var IndexName = indexName;
	var Index = 0;

	this.add = function(item) {
		if(this.contains(item))
			return;
		item[IndexName] = Index;
		this[Index] = item;
		Index++;
	};

	this.clear = function() {
		for(var n in this)
		if(this.contains(this[n]))
			this.remove(this[n]);
		Index = 0;
	};

	this.contains = function(item) {
		return item.hasOwnProperty(IndexName) &&
			this.hasOwnProperty(item[IndexName]) &&
			item === this[item[IndexName]];
	};

	this.remove = function(item) {
		if(!this.contains(item))
			return;
		delete this[item[IndexName]];
		delete item[IndexName];
	};
}
//----- Tank class -----
function Tank(x_init, y_init, team, type, teamnum) {
	var X = x_init;
	var Y = y_init;
	var DestX = x_init;
	var DestY = y_init;
	var Team = team;
	var Teamnum = teamnum;
	var Type = type;
	var Time = 60;
	var HitPoints = Type.HitPoints;
	var Cooldown = Type.Kind === TankKindEnum.BASE ? Math.random() * Type.CooldownTime : Type.CooldownTime;
	var Target = null;

	var BaseAngle = 0;
	var TargetBaseAngle = 0;
	var TurretAngle = 0;
	var TargetTurretAngle = 0;
	var Health = 10;

	var State = TankStateEnum.IDLE;
	if(Type.Kind === TankKindEnum.PLANE || Type.Kind === TankKindEnum.BUILDER) {
		State = TankStateEnum.MOVE;
		TargetBaseAngle = 2 * Math.PI * Math.random();
		BaseAngle = 2 * Math.PI * Math.random();
	}

	var This = this;

	//Privileged:
	if(Type.Kind === TankKindEnum.BASE) {
		this.doStuff = function() {
			State = TankStateEnum.IDLE;
			
			switch(State)
			{
				case TankStateEnum.IDLE:
				
					if(Cooldown > 0)
						Cooldown--;
					else
					{
						var angle = Math.random() * 2 * Math.PI;
						var TypeToMake;
						var rand = Math.floor(Math.random() * TotalProb);
						for(var i = 0; i < TankTypes.length; i++){
							if(rand < TankTypes[i].Prob) {
								TypeToMake = TankTypes[i];
								break;
							} else {
								rand -= TankTypes[i].Prob;
							}						
						}
		
						Tanks.add(new Tank(X + 25 * Math.cos(angle), Y + 25 * Math.sin(angle), Team, TypeToMake, teamnum));
						Cooldown = Type.CooldownTime;
					}
				
					findFriendlies();
					heal();
					
					break;
			}
			
		}
	} else if(Type.Kind === TankKindEnum.TANK) {
		this.doStuff = function() {
			switch (State)
			{
				case TankStateEnum.IDLE:
					if(Math.random() < MOVE_PROB) {
						TargetBaseAngle = 2 * Math.PI * Math.random();
						State = TankStateEnum.MOVE;
					}
					TargetTurretAngle = TargetBaseAngle;
					turnTurret();
					findTargets();
					break;
				case TankStateEnum.MOVE:
					moveForward();
					if(Math.random() < MOVE_PROB)
						State = TankStateEnum.IDLE;
					if(Math.random() < MOVE_PROB)
						TargetBaseAngle = 2 * Math.PI * Math.random();
					TargetTurretAngle = TargetBaseAngle;
					turnTurret();
					findTargets();
					break;
				case TankStateEnum.TARGET_AQUIRED:
					if(Target === null || !Tanks.contains(Target)) {
						State = TankStateEnum.IDLE;
						Target = null;
					} else {
						var TargetDistanceSquared = Target.getDistanceSquaredFromPoint(X, Y);
						if(TargetDistanceSquared <= Type.MinRange * Type.MinRange) {
							setTargetTurretAngle(Target);
							turnTurret();
							TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X) + Math.PI;
							moveForward();							
						} else if(TargetDistanceSquared <= Type.AttackDistance * Type.AttackDistance) {
							State = TankStateEnum.TARGET_IN_RANGE;
						} else {
							setTargetTurretAngle(Target);
							turnTurret();
							TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);
							moveForward();
							if(TargetDistanceSquared < Type.AttackRange * Type.AttackRange)
								attack();
						}
					}

					break;
				case TankStateEnum.TARGET_IN_RANGE:
					if(Target === null || !Tanks.contains(Target)) {
						State = TankStateEnum.IDLE;
						DestX = X;
						DestY = Y;
						Target = null;
					} else {
						if(Target.getDistanceSquaredFromPoint(X, Y) > Type.AttackDistance * Type.AttackDistance) {
							State = TankStateEnum.TARGET_AQUIRED;
						} else {
							setTargetTurretAngle(Target);
							turnTurret();
							attack();
						}
					}
					break;
			}
			if(Cooldown > 0)
				Cooldown--;
		};
	} else if(Type.Kind === TankKindEnum.BUILDER) {
		this.doStuff = function() {
			switch (State)
			{
				case TankStateEnum.IDLE:
					if(Math.random() < MOVE_PROB) {
						TargetBaseAngle = 2 * Math.PI * Math.random();
						State = TankStateEnum.MOVE;
					}
					break;
				case TankStateEnum.MOVE:
					moveForward();
					if(Math.random() < MOVE_PROB)
						State = TankStateEnum.IDLE;
					if(Math.random() < MOVE_PROB)
						TargetBaseAngle = 2 * Math.PI * Math.random();
					break;
				case TankStateEnum.TARGET_AQUIRED:
					if(Target === null || !Tanks.contains(Target)) {
						State = TankStateEnum.IDLE;
						Target = null;
					} else {
						TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X) + Math.PI;
						moveForward(); //Run away!
						if(Target.getDistanceSquaredFromPoint(X, Y) >= Type.SightDistance * Type.SightDistance) 
							State = TankStateEnum.IDLE;
					}
					break;
			}
			if(Cooldown > 0) {
				Cooldown--;
			} else {
				var dontBuild = false;
				for(var n in Tanks) {
					if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
						if(Tanks[n].isBase() && Tanks[n].getDistanceSquaredFromPoint(X, Y) < MIN_BASE_DISTANCE_SQUARE) {
							dontBuild = true;
							break;
						}
					}
				}
				if(dontBuild) {
					Cooldown += 5;
				} else {
					Tanks.add(new Tank(X, Y, Team, BaseType, teamnum));
					Team.setScore(Team.getScore()-1);
					Tanks.remove(This);
				}
			}
		}
	} else if(Type.Kind === TankKindEnum.TURRET) {
		this.doStuff = function() {
			switch (State)
			{
				case TankStateEnum.IDLE:
					if(Math.random() < MOVE_PROB)
						TargetTurretAngle = 2 * Math.PI * Math.random() - Math.PI;						
					turnTurret();
					findTargets();
					break;
				case TankStateEnum.TARGET_AQUIRED:
					if(Target === null || !Tanks.contains(Target) 
						|| Target.getDistanceSquaredFromPoint(X, Y) > Type.AttackRange * Type.AttackRange) {
						State = TankStateEnum.IDLE;
						Target = null;
					} else {
						var TargetDistanceSquared = Target.getDistanceSquaredFromPoint(X, Y);
						if(TargetDistanceSquared > Type.MinRange * Type.MinRange) {
							setTargetTurretAngle(Target);
							turnTurret();
							attack();
						}
					}

					break;				
			}
			if(Cooldown > 0)
				Cooldown--;
		};

	} else if(Type.Kind === TankKindEnum.PLANE) {
		this.doStuff = function() {
			switch (State)
			{
				case TankStateEnum.MOVE:
					moveForward();
					if(Math.random() < MOVE_PROB)
						TargetBaseAngle = 2 * Math.PI * Math.random();
					turnTurret();
					findTargets();					
					break;
				case TankStateEnum.TARGET_AQUIRED:					
					moveForward();
					TurretAngle = BaseAngle;
					setTargetTurretAngle(Target);
					if(Math.abs(TargetTurretAngle - TurretAngle) < Type.TurretTurnSpeed)
						TargetTurretAngle = TurretAngle;

					if(Target === null || !Tanks.contains(Target)) {
						State = TankStateEnum.MOVE;
						Target = null;
					} else {
						var TargetDistanceSquared = Target.getDistanceSquaredFromPoint(X, Y);
						if(TargetDistanceSquared > Type.MinRange * Type.MinRange && TargetDistanceSquared <= Type.AttackDistance * Type.AttackDistance) {
							var angle = Math.atan2(Target.getY() - Y, Target.getX() - X);
							if(Math.cos(BaseAngle - angle) > 0)
								TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);

							attack();
						} else {
							//Search for a better target:
							var TargetQualityFunction = function(target) {
								var angle = Math.atan2(target.getY() - Y, target.getX() - X);
								var distance = Math.sqrt(target.getDistanceSquaredFromPoint(X, Y));
								return Math.cos(BaseAngle - angle) * (Type.SightDistance-Math.abs((Type.AttackDistance + Type.MinRange) / 2 - distance));
							}
							var TargetQuality = TargetQualityFunction(Target);
							for(var n in Tanks) {
								if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
									if(Tanks[n].getTeam() != Team && Tanks[n].getDistanceSquaredFromPoint(X, Y) < Type.SightDistance * Type.SightDistance 
										&& (Type.AntiAircraft || !Tanks[n].isPlane())) {
											var quality = TargetQualityFunction(Tanks[n]);
											if(quality > TargetQuality) {
												TargetQuality = quality;
												Target = Tanks[n];
											}
									}
								}
							}

							if(TargetDistanceSquared > Type.MinRange * Type.MinRange)
								TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);
						}
					}
					
					break;
				case TankStateEnum.CRASH_AND_BURN:
					if(Time-- > 0) {
						if(!(Target === null || !Tanks.contains(Target))) 
							TargetBaseAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);
						
						moveForward();
						Smokes.add(new Smoke(X, Y, 1, 6, 25, 200));
					} else {
						AreaDamage(X, Y, 100, 400, null);
						die();
					}

					break;
			}
			if(Cooldown > 0)
				Cooldown--;
		};

	}
	
	this.isBase = function() {
		return Type.Kind == TankKindEnum.BASE;
	}

	this.isPlane = function() {
		return Type.Kind == TankKindEnum.PLANE;
	}

	this.getTeam = function() {
		return Team;
	};
	this.getTeamnum = function()
	{
		return Teamnum;
	}

	this.getDistanceSquaredFromPoint = function(x, y) {
		return (X - x) * (X - x) + (Y - y) * (Y - y);
	};

	this.getRadiusSquared = function() {
		return Type.Radius * Type.Radius;
	};

	this.getX = function() {
		return X;
	}

	this.getY = function() {
		return Y;
	}

	this.getDx = function() {
		if(State === TankStateEnum.MOVE || State === TankStateEnum.TARGET_AQUIRED || State === TankStateEnum.CRASH_AND_BURN) {
			if(Math.abs(TargetBaseAngle - BaseAngle) < MAX_MOVE_ANGLE)
				return Type.MoveSpeed * Math.cos(BaseAngle);
			else
				return 0;
		} else {
			return 0;
		}
	}

	this.getDy = function() {
		if(State === TankStateEnum.MOVE || State === TankStateEnum.TARGET_AQUIRED || State === TankStateEnum.CRASH_AND_BURN) {
			if(Math.abs(TargetBaseAngle - BaseAngle) < MAX_MOVE_ANGLE)
				return Type.MoveSpeed * Math.sin(BaseAngle);
			else
				return 0;
		} else {
			return 0;
		}
	}

	this.attackingTarget = function(target) {
		return Type.AttackingUnit ? target === Target : false;
	}

	this.takeDamage = function(damage, shooter) {
		HitPoints -= damage;
		Team.addTaken(damage);
		if(shooter !== null && shooter.getTeam() !== Team)
		{
			shooter.getTeam().addGiven(damage);
			if(Tanks.contains(shooter)){ //Make sure the shooter of this bullet isn't already dead!
				if(Type.AntiAircraft || !shooter.isPlane()) {
					if(State == TankStateEnum.TARGET_AQUIRED || State == TankStateEnum.TARGET_IN_RANGE) {
						if(!Target.attackingTarget(This)) { //Don't change targets if the current target is attacking this tank
							Target = shooter;
							State = TankStateEnum.TARGET_AQUIRED;
						}
					} else {
						Target = shooter;
						State = TankStateEnum.TARGET_AQUIRED;
					}
				}
			}
			callFriendlies(shooter);
		}

		if(HitPoints <= 0)
			if(Type.Kind === TankKindEnum.PLANE)
				State = TankStateEnum.CRASH_AND_BURN;
			else	
				die();
			
		
	};
	
	this.recoverHitPoints = function(Health)
	{
		if(HitPoints == Type.HitPoints) return;
		
		HitPoints += Health;
		
		if(HitPoints > Type.HitPoints)
			HitPoints = Type.HitPoints; // Can't heal over the max HP of the unit.
	};

	if(Type.Kind === TankKindEnum.BASE) {
		this.draw = function(canvasContext) {
			canvasContext.fillStyle = Team.getColor().getColorString();
			canvasContext.fillRect (X - 10, Y - 10, 20, 20);	
			canvasContext.fillStyle = (new Color(0, 130, 0)).getColorString();
			canvasContext.fillRect(X-10,Y-15,20*(HitPoints/Type.HitPoints),2);
		};
	} else if(Type.Kind === TankKindEnum.TANK || Type.Kind === TankKindEnum.BUILDER || Type.Kind === TankKindEnum.TURRET) {
		this.draw = function(canvasContext) {
			canvasContext.fillStyle = (new Color(0, 130, 0)).getColorString();
			canvasContext.fillRect(X-10,Y-15,20*(HitPoints/Type.HitPoints),2);
			//Base:
			if(!(Type.Kind === TankKindEnum.TURRET)) {
				canvasContext.save();
				canvasContext.translate(X, Y);
				canvasContext.rotate(BaseAngle);

				canvasContext.strokeStyle = Team.getColor().getColorString();
			
				canvasContext.beginPath();
				canvasContext.moveTo(12, 6);
				canvasContext.lineTo(-12, 6);
				canvasContext.lineTo(-12, -6);
				canvasContext.lineTo(12, -6);
				canvasContext.closePath();
				canvasContext.stroke();
				canvasContext.restore();
			}

			//Turret:
			canvasContext.save();
			canvasContext.translate(X, Y);
			canvasContext.rotate(TurretAngle);

			canvasContext.strokeStyle = Team.getColor().getColorString();
			canvasContext.fillStyle = Team.getColor().getColorString();

			canvasContext.beginPath();
			if(Type.DoubleTurret) {
				canvasContext.moveTo(0, Type.TurretSeparation);
				canvasContext.lineTo(Type.BarrelLength, Type.TurretSeparation);
				canvasContext.moveTo(0, -Type.TurretSeparation);
				canvasContext.lineTo(Type.BarrelLength, -Type.TurretSeparation);
			} else {
				canvasContext.moveTo(0, 0);
				canvasContext.lineTo(Type.BarrelLength, 0);
			}			
			canvasContext.stroke();

			canvasContext.beginPath();
			canvasContext.arc(0, 0, Type.TurretSize, 0, 2 * Math.PI, false);
			canvasContext.fill();
			canvasContext.restore();
		};
	} else if(Type.Kind === TankKindEnum.PLANE) {
		this.draw = function(canvasContext) {
			canvasContext.fillStyle = (new Color(0, 130, 0)).getColorString();
			canvasContext.fillRect(X-10,Y-15,20*(HitPoints/Type.HitPoints),2);

			canvasContext.save();
			canvasContext.translate(X, Y);
			canvasContext.rotate(BaseAngle);

			canvasContext.strokeStyle = Team.getColor().getColorString();
			
			canvasContext.beginPath();
			canvasContext.moveTo(-12, 0);
			canvasContext.lineTo(12, 0);
			canvasContext.moveTo(0, 0);
			canvasContext.lineTo(-5, -8);
			canvasContext.moveTo(0, 0);
			canvasContext.lineTo(-5, 8);
			canvasContext.stroke();

			canvasContext.restore();
		}
	}

	this.callToAttack = function (target) {
		if(!Type.AttackingUnit)
			return;
		if(!Type.AntiAircraft && target.isPlane())
			return;
						
		if(State == TankStateEnum.IDLE || State == TankStateEnum.MOVE) {
			Target = target;
			State = TankStateEnum.TARGET_AQUIRED;
		}
	}

	//Private:
	function heal() {
		AreaHeal(X,Y, Health, BASE_HEAL_RADIUS * BASE_HEAL_RADIUS);
	};
	
	function die() {
		var exps = Math.floor(Math.random() * 12 + 8);
		for(var i = 0; i < exps; i++) {
			Explosions.add(new Explosion(X + Math.random() * 14 - 7, Y + Math.random() * 14 - 7, i * 2, 12 + Math.random() * 10));
		}

		var debris = Math.floor(3 + Math.random() * 7);
		for(i = 0; i < debris; i++) {
			var angle = Math.random() * 2 * Math.PI;
			var speed = Math.random() * 4 + .2;
			DebrisSet.add(new Debris(X, Y, Math.cos(angle) * speed + This.getDx(), Math.sin(angle) * speed + This.getDy(), Math.random() * 10 + 20));
		}
		console.log(Team.getScore());
		Team.setScore(Team.getScore() - 1);
		Tanks.remove(This);
	}

	function callFriendlies(target) {
		for(var n in Tanks) {
			if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
				if(Tanks[n].getTeam() == Team) {
					Tanks[n].callToAttack(target);
				}
			}
		}
	}

	function findTargets() {
		if(Math.random() < .2) {
			for(var n in Tanks) {
				if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
					if(Tanks[n].getTeam() != Team && Tanks[n].getDistanceSquaredFromPoint(X, Y) < Type.SightDistance * Type.SightDistance 
						&& (Type.AntiAircraft || !Tanks[n].isPlane())) {
						Target = Tanks[n];
						State = TankStateEnum.TARGET_AQUIRED;

						if(!Type.AntiAircraft || Tanks[n].isPlane()) //AA tanks try to attack planes first of all
							break;
					}
				}
			}
		}
	};
	
	function findFriendlies() {
		if(Math.random() < .2) {
			for(var n in Tanks) {
				if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
					if(Tanks[n].getTeam() == Team && Tanks[n].getDistanceSquaredFromPoint(X, Y) < Type.SightDistance * Type.SightDistance) {
						Target = Tanks[n];
						State = TankStateEnum.TARGET_AQUIRED;
					}
				}
			}
		}
	};

	function chooseRandomDestination() {
		DestX = DestX + Math.random() * (MOVE_RANGE * 2 + 1) - MOVE_RANGE;
		DestY = DestY + Math.random() * (MOVE_RANGE * 2 + 1) - MOVE_RANGE;
		if(DestX > WIDTH - 10)
			DestX = WIDTH - 10;
		else if(DestX < 10)
			DestX = 10;
		if(DestY > HEIGHT - 10)
			DestY = HEIGHT - 10;
		else if(DestY < 10)
			DestY = 10;
	};

	function moveForward(){
		//Find heading towards destination:
		
		while(TargetBaseAngle > Math.PI)
			TargetBaseAngle -=  2 * Math.PI;
		while(TargetBaseAngle < -Math.PI)
			TargetBaseAngle += 2 * Math.PI;

		//Turn towards heading:
		angleDiff = TargetBaseAngle - BaseAngle;
		if(Math.abs(angleDiff) > Math.PI) {
			if(angleDiff > 0)
				BaseAngle -= Type.TurnSpeed;
			else
				BaseAngle += Type.TurnSpeed;
		} else {
			if(Math.abs(angleDiff) > Type.TurnSpeed) {
				if(angleDiff > 0)
					BaseAngle += Type.TurnSpeed;
				else
					BaseAngle -= Type.TurnSpeed;
			} else {
				BaseAngle = TargetBaseAngle;
			}
		}
		if(BaseAngle > Math.PI)
			BaseAngle -=  2 * Math.PI;
		if(BaseAngle < -Math.PI)
			BaseAngle += 2 * Math.PI;

		//Move along current heading:
		if(Math.abs(TargetBaseAngle - BaseAngle) < MAX_MOVE_ANGLE || Type.Kind == TankKindEnum.PLANE)
		{
			X += Type.MoveSpeed * Math.cos(BaseAngle);
			Y += Type.MoveSpeed * Math.sin(BaseAngle);

			if(X > WIDTH - 10 || X < 10 || Y > HEIGHT - 10 || Y < 10)
				BaseAngle += Math.PI;

			if(X > WIDTH - 10)
				X = WIDTH - 10;
			else if(X < 10)
				X = 10;
			if(Y > HEIGHT - 10)
				Y = HEIGHT - 10;
			else if(Y < 10)
				Y = 10;
		}
	};

	function setTargetTurretAngle(target) {
		var Tx = target.getX(), Ty = Target.getY();
		var ShotTime = Math.sqrt(Target.getDistanceSquaredFromPoint(X, Y)) / Type.BulletSpeed;
		Tx += Target.getDx() * ShotTime;
		Ty += Target.getDy() * ShotTime;
		TargetTurretAngle = Math.atan2(Ty - Y, Tx - X);

	}

	function turnTurret() {
		var angleDiff = TargetTurretAngle - TurretAngle;
		if(Math.abs(angleDiff) > Math.PI) {
			if(angleDiff > 0)
				TurretAngle -= Type.TurretTurnSpeed;
			else
				TurretAngle += Type.TurretTurnSpeed;
		} else {
			if(Math.abs(angleDiff) > Type.TurretTurnSpeed) {
				if(angleDiff > 0)
					TurretAngle += Type.TurretTurnSpeed;
				else
					TurretAngle -= Type.TurretTurnSpeed;
			} else {
				TurretAngle = TargetTurretAngle;
			}
		}
		if(TurretAngle > Math.PI)
			TurretAngle -=  2 * Math.PI;
		if(TurretAngle < -Math.PI)
			TurretAngle += 2 * Math.PI;
	};

	function attack() {
		if(Cooldown <= 0) {
			if(TurretAngle === TargetTurretAngle || Type.BulletType === ShotTypeEnum.MISSLE) {
				var speed = Type.BulletSpeed;
				if(Type.BulletType === ShotTypeEnum.SHELL) {
					speed = (0.95 + Math.random() * .1) * (Math.sqrt(Target.getDistanceSquaredFromPoint(X, Y)) - Type.BarrelLength) / Type.BulletTime;
				}
				if(Type.DoubleTurret) {
					//TurretSeparation
					Bullets.add(new Bullet(X + Math.cos(TurretAngle) * Type.BarrelLength + Math.cos(TurretAngle + Math.PI / 4) * Type.TurretSeparation, Y + Math.sin(TurretAngle) * Type.BarrelLength + Math.sin(TurretAngle + Math.PI / 4) * Type.TurretSeparation, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), Type.BulletTime, Team, Type.BulletDamage, This, Type.BulletType, Target, Type.AntiAircraft));
					Bullets.add(new Bullet(X + Math.cos(TurretAngle) * Type.BarrelLength + Math.cos(TurretAngle - Math.PI / 4) * Type.TurretSeparation, Y + Math.sin(TurretAngle) * Type.BarrelLength + Math.sin(TurretAngle - Math.PI / 4) * Type.TurretSeparation, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), Type.BulletTime, Team, Type.BulletDamage, This, Type.BulletType, Target, Type.AntiAircraft));
					
				} else {
					Bullets.add(new Bullet(X + Math.cos(TurretAngle) * Type.BarrelLength, Y + Math.sin(TurretAngle) * Type.BarrelLength, speed * Math.cos(TurretAngle), speed * Math.sin(TurretAngle), Type.BulletTime, Team, Type.BulletDamage, This, Type.BulletType, Target, Type.AntiAircraft));
				}
				Cooldown = Type.CooldownTime;
			}
		}
	};
	Team.setScore(Team.getScore() + 1);
}
//----- Bullet class -----
function Bullet (x, y, dx, dy, time, team, damage, shooter, type, target, airAttack) {
	var X = x, Y = y, Dx = dx, Dy = dy, Time = time, Team = team, Damage = damage, Shooter = shooter, Type = type, Target = target;
	var AirAttack = airAttack;
	var LastX = x, LastY = y;
	var This = this;
	var LastAngle;

	if(Target != null && Tanks.contains(Target) && Type === ShotTypeEnum.MISSLE)
		LastAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);
	
	//Privileged:
	this.move = function() {
		
		X += Dx;
		Y += Dy;
		Time--;
		
		if(Type === ShotTypeEnum.MISSLE) {
			Smokes.add(new Smoke(X, Y, 2, 3, 20, 150));
			Smokes.add(new Smoke((X + LastX) / 2, (Y + LastY) / 2, 1, 3, 20, 150));
			
			LastX = X;
			LastY = Y;

			if(Target === null || !Tanks.contains(Target)) {
				var BestDotProduct = -1;
				for(var n in Tanks) {
					if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
						var DistanceMagSquared = Tanks[n].getDistanceSquaredFromPoint(X, Y);
						if(Tanks[n].getTeam() != Team &&  DistanceMagSquared < 200 * 200 && (AirAttack || !Tanks[n].isPlane())) {
							var SpeedMag = Math.sqrt(Dx * Dx + Dy * Dy);
							var DistanceMag = Math.sqrt(DistanceMagSquared);
							var DotProduct = (Dx * (Tanks[n].getX() - X) + Dy * (Tanks[n].getY() - Y)) 
											/ (SpeedMag * DistanceMag);
							if(DotProduct > BestDotProduct) {								
								Target = Tanks[n];	
								LastAngle = Math.atan2(Target.getY() - Y, Target.getX() - X);						
								BestDotProduct = DotProduct;
							}
						}
					}
				}
			}

			if(Target != null && Tanks.contains(Target)) {
				var speed = MISSLE_ACCELERATION + Math.sqrt(Dx * Dx + Dy * Dy);
				var angle = Math.atan2(Dy, Dx);
				var angleToTarget = Math.atan2(Target.getY() - Y, Target.getX() - X);
				var RotateAngle = MISSLE_ROTATION * (angleToTarget - LastAngle); 
				angle += RotateAngle > 0 ? Math.min(RotateAngle, MAX_MISSLE_ROTATION) 
				                         : Math.max(RotateAngle, -MAX_MISSLE_ROTATION);
				LastAngle = angleToTarget;

				Dx = speed * Math.cos(angle);
				Dy = speed * Math.sin(angle);
			} 
		}


		if(Time <= 0)
			explode();

		if(Type != ShotTypeEnum.SHELL && Type != ShotTypeEnum.BOMB)
		{
			for(var n in Tanks) {
				if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
					if(Tanks[n].getTeam() != Team &&
						Tanks[n].getDistanceSquaredFromPoint(X, Y) < Math.max(Dx * Dx + Dy * Dy, Tanks[n].getRadiusSquared()) &&
						(AirAttack || !Tanks[n].isPlane())) {
							Tanks[n].takeDamage(Damage, Shooter);
							explode();						
					}
				}
			}
		}
	};

	this.draw = function(canvasContext) {
		canvasContext.beginPath();
		canvasContext.fillStyle = "rgb(255, 255,0)";
		canvasContext.fillRect (X - .5, Y -.5, 1.5, 1.5);		
	};

	//Private:
	function explode() {
		if(Type === ShotTypeEnum.SHELL) {
			AreaDamage(X, Y, Damage, SHELL_DAMAGE_RADIUS * SHELL_DAMAGE_RADIUS, Shooter);
			Explosions.add(new Explosion(X + Math.random() * 2 - 1, Y + Math.random() * 2 - 1, 0, SHELL_DAMAGE_RADIUS));		
		} else if(Type === ShotTypeEnum.BOMB) {
			AreaDamage(X, Y, Damage, BOMB_DAMAGE_RADIUS * BOMB_DAMAGE_RADIUS, Shooter);
			Explosions.add(new Explosion(X + Math.random() * 2 - 1, Y + Math.random() * 2 - 1, 0, BOMB_DAMAGE_RADIUS));		
		} else {
			Explosions.add(new Explosion(X + Math.random() * 2 - 1, Y + Math.random() * 2 - 1, 0, 6 + Math.random() * 3));		
		}

		Bullets.remove(This);
		
	};
}
//----- Explosion Class -----
function Explosion (x, y, preDisplayTime, size) {
	var X = x, Y = y, PreDisplayTime = preDisplayTime, TargetSize = size, Size = 0, GrowMode = true;

	this.update = function () {
		if(PreDisplayTime > 0) {
			PreDisplayTime--;
		}else if(GrowMode) {
			if(Size < TargetSize)
				Size++;
			else
				GrowMode = false;
		}else if(Size > 0) {
			Size--;
		}else{
			Explosions.remove(this);
		}
	};
	this.draw = function (canvasContext) {
		if(PreDisplayTime <= 0) {
			
			if(Size > 0)
			{
				var grad = canvasContext.createRadialGradient(X, Y, 0, X, Y, Size / 2);
				grad.addColorStop(0, "rgb(255, 255, 0)");
				grad.addColorStop(1, "rgb(255, 0, 0)");
				
				canvasContext.beginPath();
				canvasContext.fillStyle = grad;
				canvasContext.arc(X, Y, Size / 2, 0, 2 * Math.PI, false);
				canvasContext.fill();
			}
			
		}		
	};
	
}
//----- Smoke class -----
function Smoke (x, y, startSize, endSize, time, redness) {
	var X = x, Y = y, StartSize = startSize, EndSize = endSize, TotalTime = time, Redness = redness;
	var This = this;
	var Time = 0;
	this.update = function () {
		if(Time < TotalTime)
			Time++;
		else
			Smokes.remove(This);			
	}

	this.draw = function (canvasContext) {
		var TimeRatio = Time / TotalTime;
		var color = Math.floor(25 + 75 * TimeRatio);		
		var red = Math.floor(Redness * (1 - 4 * TimeRatio));
		if(red < 0)
			red = 0;
		if(red + color > 255)
			red = 255 - color;
		canvasContext.beginPath();
		canvasContext.fillStyle = "rgba(" + (red + color) + "," + color + "," + color + "," + (1 - TimeRatio) + ")";
		canvasContext.arc(X, Y, StartSize + (EndSize - StartSize) * Time / TotalTime, 0, 2 * Math.PI, false);
		canvasContext.fill();					
	}
}

//----- Debris class -----
function Debris (x, y, dx, dy, time, redness) {
	var X = x, Y = y, Dx = dx, Dy = dy, Time = time, TotalTime = time;
	var This = this;
	this.update = function () {
		if(Time-- > 0) {
			X += Dx;
			Y += Dy;
			Smokes.add(new Smoke(X, Y, 1, 7, 15, 200 * (Time / TotalTime)));
		} else {
			DebrisSet.remove(This);
		}		
	}	
}

//----- Team class -----
function Team (color, name) {
	var Color = color;
	var Name = name;
	var Score = 0;
	var Taken = 0;
	var Given = 0;

	this.getColor = function() {
		return Color;
	}
	this.getName = function() {
		return Name;
	}
	this.getScore = function() {
		return Score;
	}
	this.setScore = function(score) {
		Score = score;
	}
	this.getTaken = function() {
		return Taken;
	}
	this.getGiven = function() {
		return Given;
	}
	this.addTaken = function(d)
	{
		Taken = Taken + d;
		return Taken;
	}
	this.addGiven = function(d)
	{
		Given = Given + d;
		return Given;
	}
	this.reset = function()
	{
		Score = 0;
		Taken = 0;
		Given = 0;
	}
}

//----- Color class -----
function Color (r, g, b) {
	this.R = r;
	this.G = g;
	this.B = b;
	var This = this;

	this.getColorString = function() {
		return "rgb(" + This.R + "," + This.G + "," + This.B + ")";
	};
}

///////////////
// Functions //
///////////////

function AreaDamage(X, Y, Damage, RadiusSquared, Shooter) {
	for(var n in Tanks) {
		if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
			if(Tanks[n].getDistanceSquaredFromPoint(X, Y) < RadiusSquared &&  !Tanks[n].isPlane()) {
				Tanks[n].takeDamage(Damage, Shooter);
			}
		}
	}
}

function AreaHeal(X, Y, Recover, RadiusSquared)
{
	for(var n in Tanks)
		if(Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) 
			if(Tanks[n].getDistanceSquaredFromPoint(X, Y) < RadiusSquared)
			{
				Tanks[n].recoverHitPoints(Recover);
				console.log("Tank " + n + " was healed " + Recover);
			}
}

function timer() {
	var t = setTimeout(function() {timer();}, 15);
	var TankTeam = null;
	var AllOneTeam = true;

	clearArea(ctx, new Color(100, 70, 25));

	for (var n in Tanks) {
		if (Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
			if(TankTeam == null)
				TankTeam = Tanks[n].getTeam();
			else if(Tanks[n].getTeam() != TankTeam)
				AllOneTeam = false;
			
			Tanks[n].draw(ctx);				
			Tanks[n].doStuff();						
		}
	}

	for (var n in Bullets) {
		if (Bullets.hasOwnProperty(n) && Bullets.contains(Bullets[n])) {
			Bullets[n].draw(ctx);
			Bullets[n].move();
			
		}
	}

	for (var n in Smokes) {
		if (Smokes.hasOwnProperty(n) && Smokes.contains(Smokes[n])) {
			Smokes[n].draw(ctx);
			Smokes[n].update();			
		}
	}

	for (var n in Explosions) {
		if (Explosions.hasOwnProperty(n) && Explosions.contains(Explosions[n])) {
			Explosions[n].draw(ctx);
			Explosions[n].update();
			
		}
	}
	
	for (var n in DebrisSet) {
		 if (DebrisSet.hasOwnProperty(n) && DebrisSet.contains(DebrisSet[n])) {
			DebrisSet[n].update();			
		}
	}

	if(AllOneTeam && !RESTARTING) {
		RESTARTING = true;
		var r = setTimeout(function() {restart();}, 10000);
	}
	mtextloop = 0;
	/*for ( var mt in window.mTeams )
	{
		ctx.fillStyle = window.mTeams[mt].colorstring;
		ctx.fillText(mt + " : " + window.mTeams[mt].score,10,10+(12*mtextloop));
		mtextloop += 1;
	}*/
	ctx.fillStyle = Teams[6].getColor().getColorString();
	ctx.fillText("Team",10,20);
	ctx.fillText("Units",60,20);
	ctx.fillText("Damage Given",95,20);
	ctx.fillText("Damage Taken",170,20);
	for ( teamnum in Teams )
	{
		var t = Teams[teamnum];
		var voff = 35 + (12*teamnum);
		ctx.fillStyle = t.getColor().getColorString();
		//ctx.fillText(t.getName() + " : " + t.getScore() + " (" + t.getGiven() + " / " + t.getTaken() + ")",10,10+(12*teamnum));
		ctx.fillText(t.getName(),10,voff);
		ctx.fillText(t.getScore(),60,voff);
		ctx.fillText(t.getGiven(),95,voff);
		ctx.fillText(t.getTaken(),170,voff);
	}
}

function restart() {
	countTotalProbability();
	Tanks.clear();
	Bullets.clear();
	Explosions.clear();
	Smokes.clear();
	for(var i = 0; i < Teams.length; i++) {
		Teams[i].reset();
		//MIN_SEPERATION_OF_STARTING_BASES
		var TooClose = true;
		var attempts = 0;
		while(TooClose && attempts++ < 100) {
			TooClose = false;
			x = Math.random() * (WIDTH - 40) + 20;
			y = Math.random() * (HEIGHT - 40) + 20;
			for (var n in Tanks) {
				if (Tanks.hasOwnProperty(n) && Tanks.contains(Tanks[n])) {
					if(Tanks[n].getDistanceSquaredFromPoint(x, y) < MIN_SEPERATION_OF_STARTING_BASES * MIN_SEPERATION_OF_STARTING_BASES)
						TooClose = true;
				}
			}
		}
		
		Tanks.add(new Tank(x, y, Teams[i], BaseType, Teams[i].getName()));
	}
	
	RESTARTING = false;

}

function countTotalProbability() {
	TotalProb = 0;
	for(var i = 0; i < TankTypes.length; i++)
		TotalProb += TankTypes[i].Prob;
}

function clearArea(canvasContext, color)
{
	canvasContext.fillStyle = color.getColorString();
	canvasContext.fillRect (0, 0, WIDTH, HEIGHT);
}