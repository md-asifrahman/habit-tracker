package com.habittracker.user;

import com.habittracker.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String timezone = "UTC";

    /**
     * Bumped to revoke every token issued so far — the remedy for a lost or stolen phone.
     * Tokens carry the version they were minted with and are rejected once it falls behind.
     */
    @Column(nullable = false)
    private int tokenVersion = 0;
}
