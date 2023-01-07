import { Connection, createConnection } from "typeorm";
import { UserRepository } from "../../../src/user/repositories/user.repository";
import { Join } from "../../../src/common/utilities/QueryBuilder/Join";
import { ConditionGroup } from "../../../src/common/utilities/QueryBuilder/ConditionGroup";
import { Condition } from "../../../src/common/utilities/QueryBuilder/Condition";
import { Sort } from "../../../src/common/utilities/QueryBuilder/Sort";
import { FilterInfo } from "../../../src/common/utilities/QueryBuilder/FilterInfo";


describe('Common Repository', () => {

    let connection: Connection;

    beforeAll(async () => {
        connection = await createConnection({
            "type": "mysql",
            "host": "localhost",
            "port": 3306,
            "username": "root",
            "password": "12345678",
            "database": "node_test",
            "synchronize": false,
            "logging": true,
            "entities": [
                "src/**/*.entity.ts"
            ]
        }).catch(error => {
            throw new Error('Error with connection');
        });
    });

    afterAll(async () => {
        connection.close().catch(error => {
            throw new Error(error);
        });
    });

    test('entity select nested conditions', () => {

        
        const userRepository = connection.getCustomRepository(UserRepository);
        
        const orConditions = new ConditionGroup([
            new Condition('user.name LIKE :testusername', {testusername: 'test%'}),
            new Condition("user.surname LIKE :testusersurname", {testusersurname: 'test%'})
        ], true);
    
    
        const andCondtions = new ConditionGroup([
            new Condition('user.deleted = 0'),
            new Condition(orConditions)
        ]);
    
        const sort = new Sort('user.id', 'DESC');
    
        const filterInfo = new FilterInfo(andCondtions, sort, 'user.id');
    
        const select = [
            'user.id'
        ];
        const selectQuery = userRepository.getEntitySelect(select, [], filterInfo, 10, 10).getSql();
    
        expect(selectQuery).toEqual("SELECT `user`.`id` AS `user_id` FROM `user` `user` WHERE `user`.`deleted` = 0 AND (`user`.`name` LIKE ? OR `user`.`surname` LIKE ?) GROUP BY `user`.`id` ORDER BY `user`.`id` DESC LIMIT 10 OFFSET 10");
    });
});